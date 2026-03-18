import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { normalizeLabel } from "@/lib/category-mapping";
import { predictSpendingMl } from "@/lib/ml-client";
import { prisma } from "@/lib/prisma";
import {
  buildCategoryDailyExpenses,
  buildDailyExpenses,
  buildHistoricalMonthlyExpenses,
} from "@/lib/spending-payload";
import { budgetCreateSchema } from "@/lib/validations";
import { EntryType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const { start, end } = getMonthRange(year, month);

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: {
      category: {
        select: { id: true, name: true, type: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const [monthExpenseTransactions, historyExpenseTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        type: EntryType.EXPENSE,
        date: { gte: start, lte: end },
      },
      include: {
        category: { select: { name: true } },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: EntryType.EXPENSE,
        date: { lt: start },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const spendingPrediction = await predictSpendingMl({
    month,
    year,
    daily_expenses: buildDailyExpenses(
      monthExpenseTransactions.map((item) => ({
        date: item.date,
        amount: Number(item.amount),
        categoryName: item.category?.name,
      })),
    ),
    historical_monthly_expenses: buildHistoricalMonthlyExpenses(
      historyExpenseTransactions.map((item) => ({
        date: item.date,
        amount: Number(item.amount),
      })),
      6,
    ),
    category_daily_expenses: buildCategoryDailyExpenses(
      monthExpenseTransactions.map((item) => ({
        date: item.date,
        amount: Number(item.amount),
        categoryName: item.category?.name,
      })),
    ),
  });

  const categoryForecastMap = new Map(
    (spendingPrediction?.category_forecasts ?? []).map((item) => [
      normalizeLabel(item.category),
      item.predicted_monthly_spent,
    ]),
  );

  const mapped = await Promise.all(
    budgets.map(async (budget) => {
      const aggregate = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: EntryType.EXPENSE,
          categoryId: budget.categoryId ?? undefined,
          date: { gte: start, lte: end },
        },
      });
      const spent = Number(aggregate._sum.amount ?? 0);
      const limit = Number(budget.amountLimit);
      const ratio = limit > 0 ? spent / limit : 0;
      const predictedSpent = spendingPrediction
        ? budget.category?.name
          ? (categoryForecastMap.get(normalizeLabel(budget.category.name)) ?? spent)
          : spendingPrediction.predicted_monthly_expense
        : spent;
      const predictedRatio = limit > 0 ? predictedSpent / limit : 0;
      const predictiveWarning =
        predictedRatio >= 1 ? "LIKELY_OVER" : predictedRatio >= 0.85 ? "AT_RISK" : "ON_TRACK";
      const predictiveMessage =
        predictiveWarning === "LIKELY_OVER"
          ? "Berdasarkan tren saat ini, budget ini kemungkinan terlewati sebelum akhir bulan."
          : predictiveWarning === "AT_RISK"
            ? "Tren pengeluaran mendekati batas budget. Pertimbangkan menahan belanja."
            : "Tren pengeluaran masih aman terhadap budget.";

      return {
        ...budget,
        spent,
        predictedSpent,
        predictiveWarning,
        predictiveMessage,
        warning:
          ratio >= 1
            ? "OVER_LIMIT"
            : ratio >= 0.8
              ? "NEAR_LIMIT"
              : "SAFE",
      };
    }),
  );

  return NextResponse.json(mapped);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return unauthorized();
  }

  try {
    const parsed = budgetCreateSchema.parse(await request.json());
    let budget;
    if (parsed.categoryId) {
      budget = await prisma.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId: parsed.categoryId,
            month: parsed.month,
            year: parsed.year,
          },
        },
        create: {
          ...parsed,
          userId,
        },
        update: {
          amountLimit: parsed.amountLimit,
        },
        include: {
          category: {
            select: { id: true, name: true, type: true },
          },
        },
      });
    } else {
      const existing = await prisma.budget.findFirst({
        where: {
          userId,
          categoryId: null,
          month: parsed.month,
          year: parsed.year,
        },
      });

      budget = existing
        ? await prisma.budget.update({
            where: { id: existing.id },
            data: {
              amountLimit: parsed.amountLimit,
            },
            include: {
              category: {
                select: { id: true, name: true, type: true },
              },
            },
          })
        : await prisma.budget.create({
            data: {
              ...parsed,
              categoryId: null,
              userId,
            },
            include: {
              category: {
                select: { id: true, name: true, type: true },
              },
            },
          });
    }

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
