import { badRequest, requireUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
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

      return {
        ...budget,
        spent,
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
