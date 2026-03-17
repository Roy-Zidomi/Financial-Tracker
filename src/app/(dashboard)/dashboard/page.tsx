import { ExpensePieChart, MonthlyTrendChart } from "@/components/Charts";
import { StatCard } from "@/components/StatCard";
import { TopBar } from "@/components/TopBar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntryType } from "@prisma/client";
import { redirect } from "next/navigation";

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  const userName = session.user.name ?? "User";

  const now = new Date();
  const { start, end } = getMonthRange(now);

  const [monthTransactions, allTransactions] = await Promise.all([
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
    .map(([month, value]) => ({ month, ...value }));

  return (
    <section>
      <TopBar
        title="Dashboard"
        subtitle="Monthly financial summary and spending insights."
        userName={userName}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Income This Month" value={income} tone="income" />
        <StatCard label="Expense This Month" value={expense} tone="expense" />
        <StatCard label="Balance This Month" value={balance} tone="neutral" />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Expense by Category</h2>
          <ExpensePieChart data={expenseData} />
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Monthly Trend</h2>
          <MonthlyTrendChart data={trendData} />
        </div>
      </div>
    </section>
  );
}
