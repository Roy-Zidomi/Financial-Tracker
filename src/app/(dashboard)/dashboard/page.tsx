import { ExpensePieChart, MonthlyTrendChart } from "@/components/Charts";
import { StatCard } from "@/components/StatCard";
import { TopBar } from "@/components/TopBar";
import { auth } from "@/lib/auth";
import { normalizeLabel } from "@/lib/category-mapping";
import { generateInsightsMl, predictSpendingMl } from "@/lib/ml-client";
import { prisma } from "@/lib/prisma";
import {
  buildCategoryDailyExpenses,
  buildCategoryTotals,
  buildDailyExpenses,
  buildHistoricalMonthlyExpenses,
  getMonthRange,
  getPreviousMonthRange,
} from "@/lib/spending-payload";
import { EntryType } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  const userName = session.user.name ?? "User";

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start, end } = getMonthRange(year, month);
  const previousMonthRange = getPreviousMonthRange(year, month);

  const [
    monthTransactions,
    allTransactions,
    historyExpenseTransactions,
    previousMonthTransactions,
    monthBudgets,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: {
        category: { select: { name: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: EntryType.EXPENSE,
        date: { lt: start },
      },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: EntryType.EXPENSE,
        date: { gte: previousMonthRange.start, lte: previousMonthRange.end },
      },
      include: {
        category: { select: { name: true } },
      },
    }),
    prisma.budget.findMany({
      where: { userId, month, year },
      include: {
        category: { select: { name: true } },
      },
    }),
  ]);

  const income = monthTransactions
    .filter((item) => item.type === EntryType.INCOME)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = monthTransactions
    .filter((item) => item.type === EntryType.EXPENSE)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = income - expense;

  const byCategory = monthTransactions
    .filter((item) => item.type === EntryType.EXPENSE)
    .reduce(
      (acc, item) => {
        const key = item.category?.name ?? "Uncategorized";
        acc[key] = (acc[key] ?? 0) + Number(item.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

  const expenseData = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const trendMap: Record<string, { income: number; expense: number }> = {};
  for (const item of allTransactions) {
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!trendMap[key]) {
      trendMap[key] = { income: 0, expense: 0 };
    }
    if (item.type === EntryType.INCOME) {
      trendMap[key].income += Number(item.amount);
    } else {
      trendMap[key].expense += Number(item.amount);
    }
  }

  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([entryMonth, value]) => ({ month: entryMonth, ...value }));

  const monthExpensePoints = monthTransactions
    .filter((item) => item.type === EntryType.EXPENSE)
    .map((item) => ({
      date: item.date,
      amount: Number(item.amount),
      categoryName: item.category?.name ?? "Uncategorized",
      description: item.description ?? "",
    }));

  const spendingPrediction = await predictSpendingMl({
    month,
    year,
    daily_expenses: buildDailyExpenses(monthExpensePoints),
    historical_monthly_expenses: buildHistoricalMonthlyExpenses(
      historyExpenseTransactions.map((item) => ({
        date: item.date,
        amount: Number(item.amount),
      })),
      6,
    ),
    category_daily_expenses: buildCategoryDailyExpenses(monthExpensePoints),
  });

  const currentMonthKey = `${year}-${String(month).padStart(2, "0")}`;
  const trendDataWithPrediction = trendData.map((item) => ({
    ...item,
    predictedExpense:
      item.month === currentMonthKey
        ? spendingPrediction?.predicted_monthly_expense ?? item.expense
        : undefined,
  }));
  const categoryPredictionMap = new Map(
    (spendingPrediction?.category_forecasts ?? []).map((item) => [
      normalizeLabel(item.category),
      item.predicted_monthly_spent,
    ]),
  );

  const currentCategoryTotals = buildCategoryTotals(monthExpensePoints);
  const previousCategoryTotals = buildCategoryTotals(
    previousMonthTransactions.map((item) => ({
      date: item.date,
      amount: Number(item.amount),
      categoryName: item.category?.name ?? "Uncategorized",
    })),
  );

  const budgetPayload = monthBudgets.map((budget) => {
    const categoryName = budget.category?.name ?? "Total Expense";
    const spentForCategory = budget.category
      ? monthExpensePoints
          .filter((item) => item.categoryName === budget.category?.name)
          .reduce((sum, item) => sum + item.amount, 0)
      : expense;
    const predictedForCategory = budget.category
      ? categoryPredictionMap.get(normalizeLabel(budget.category.name)) ?? spentForCategory
      : spendingPrediction?.predicted_monthly_expense ?? expense;

    return {
      category: categoryName,
      amount_limit: Number(budget.amountLimit),
      spent: spentForCategory,
      predicted_spent: predictedForCategory,
    };
  });

  const insightsPayload = {
    month,
    year,
    current_category_totals: currentCategoryTotals,
    previous_category_totals: previousCategoryTotals,
    budgets: budgetPayload,
    prediction_summary: {
      predicted_monthly_expense: spendingPrediction?.predicted_monthly_expense ?? expense,
      current_month_expense: expense,
      historical_average_last_3_months:
        spendingPrediction?.historical_average_last_3_months ?? expense,
      trend_direction: spendingPrediction?.trend_direction ?? "STABLE",
    } as const,
    recent_transactions: monthExpensePoints.slice(-20).map((item) => ({
      description: item.description,
      category: item.categoryName,
      amount: item.amount,
    })),
  };

  const insightResponse = await generateInsightsMl(insightsPayload);
  const insights =
    insightResponse?.insights ??
    [
      {
        level: "info" as const,
        message: "Insight AI belum tersedia. Jalankan ML service untuk mendapatkan insight otomatis.",
      },
    ];

  const trendCopy =
    spendingPrediction?.trend_direction === "UP"
      ? "Naik"
      : spendingPrediction?.trend_direction === "DOWN"
        ? "Turun"
        : "Stabil";

  return (
    <section>
      <TopBar
        title="Dashboard"
        subtitle="Monthly financial summary and spending insights."
      />
      <div className="mb-4 rounded-xl border border-cyan-900/60 bg-gradient-to-r from-cyan-900/20 to-transparent p-4">
        <h2 className="text-lg font-semibold text-slate-100">Hai, {userName}</h2>
        <p className="mt-1 text-sm text-slate-300">
          Semoga harimu produktif. Pantau cashflow hari ini dan jaga ritme keuanganmu tetap stabil.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income This Month" value={income} tone="income" />
        <StatCard label="Expense This Month" value={expense} tone="expense" />
        <StatCard label="Balance This Month" value={balance} tone="neutral" />
        <StatCard
          label="Predicted Expense (AI)"
          value={spendingPrediction?.predicted_monthly_expense ?? expense}
          tone={
            (spendingPrediction?.predicted_monthly_expense ?? expense) > expense
              ? "expense"
              : "neutral"
          }
        />
      </div>
      <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
        <p className="text-sm text-slate-300">
          Tren prediksi:{" "}
          <span className="font-semibold text-slate-100">{trendCopy}</span>
          {spendingPrediction
            ? ` | Confidence ${Math.round(spendingPrediction.confidence_score * 100)}%`
            : ""}
        </p>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Expense by Category</h2>
          <ExpensePieChart data={expenseData} />
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Monthly Trend (Actual vs Predicted)</h2>
          <MonthlyTrendChart data={trendDataWithPrediction} />
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Smart Insights</h2>
        <div className="grid gap-2">
          {insights.map((item) => (
            <div
              key={item.message}
              className={`rounded-lg px-3 py-2 text-sm ${
                item.level === "critical"
                  ? "bg-rose-900/30 text-rose-100"
                  : item.level === "warning"
                    ? "bg-amber-900/30 text-amber-100"
                    : "bg-slate-800/70 text-slate-200"
              }`}
            >
              {item.message}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
