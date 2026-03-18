type ExpensePoint = {
  amount: number;
  date: Date;
  categoryName?: string | null;
};

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getPreviousMonthRange(year: number, month: number) {
  const currentStart = new Date(year, month - 1, 1);
  const previousMonthEnd = new Date(currentStart.getTime() - 1);
  const start = new Date(previousMonthEnd.getFullYear(), previousMonthEnd.getMonth(), 1);
  const end = new Date(
    previousMonthEnd.getFullYear(),
    previousMonthEnd.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

export function buildDailyExpenses(transactions: ExpensePoint[]) {
  const byDate = transactions.reduce<Record<string, number>>((acc, item) => {
    const key = toDateKey(item.date);
    acc[key] = (acc[key] ?? 0) + item.amount;
    return acc;
  }, {});

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

export function buildCategoryDailyExpenses(transactions: ExpensePoint[]) {
  const byKey = transactions.reduce<Record<string, { category: string; date: string; amount: number }>>(
    (acc, item) => {
      const category = item.categoryName ?? "Uncategorized";
      const date = toDateKey(item.date);
      const key = `${category}::${date}`;
      const current = acc[key];
      if (current) {
        current.amount += item.amount;
      } else {
        acc[key] = { category, date, amount: item.amount };
      }
      return acc;
    },
    {},
  );

  return Object.values(byKey);
}

export function buildHistoricalMonthlyExpenses(transactions: ExpensePoint[], maxMonths = 6) {
  const byMonth = transactions.reduce<Record<string, number>>((acc, item) => {
    const monthKey = toMonthKey(item.date);
    acc[monthKey] = (acc[monthKey] ?? 0) + item.amount;
    return acc;
  }, {});

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-maxMonths)
    .map(([month, total]) => ({ month, total }));
}

export function buildCategoryTotals(transactions: ExpensePoint[]) {
  const byCategory = transactions.reduce<Record<string, number>>((acc, item) => {
    const category = item.categoryName ?? "Uncategorized";
    acc[category] = (acc[category] ?? 0) + item.amount;
    return acc;
  }, {});

  return Object.entries(byCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
