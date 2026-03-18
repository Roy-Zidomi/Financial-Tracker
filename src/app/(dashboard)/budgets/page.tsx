"use client";

import { BudgetForm } from "@/components/BudgetForm";
import { TopBar } from "@/components/TopBar";
import { formatCurrency } from "@/lib/utils";
import type { EntryType } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

type BudgetCategory = {
  id: string;
  name: string;
  type: EntryType;
};

type BudgetWarning = "SAFE" | "NEAR_LIMIT" | "OVER_LIMIT";
type PredictiveWarning = "ON_TRACK" | "AT_RISK" | "LIKELY_OVER";

type Budget = {
  id: string;
  amountLimit: string | number;
  spent: number;
  predictedSpent: number;
  predictiveWarning: PredictiveWarning;
  predictiveMessage: string;
  month: number;
  year: number;
  category: {
    id: string;
    name: string;
  } | null;
  warning: string;
};

const warningStyle: Partial<Record<BudgetWarning, string>> = {
  SAFE: "text-emerald-200 bg-emerald-900/30",
  NEAR_LIMIT: "text-amber-200 bg-amber-900/30",
  OVER_LIMIT: "text-rose-200 bg-rose-900/30",
};

const predictiveStyle: Record<PredictiveWarning, string> = {
  ON_TRACK: "text-emerald-200 bg-emerald-900/30",
  AT_RISK: "text-amber-200 bg-amber-900/30",
  LIKELY_OVER: "text-rose-200 bg-rose-900/30",
};

export default function BudgetsPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [categoriesRes, budgetsRes] = await Promise.all([
      fetch("/api/categories"),
      fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
    ]);

    if (categoriesRes.ok) {
      const categoryPayload = (await categoriesRes.json()) as BudgetCategory[];
      setCategories(categoryPayload);
    }
    if (budgetsRes.ok) {
      const budgetPayload = (await budgetsRes.json()) as Budget[];
      setBudgets(budgetPayload);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function removeBudget(id: string) {
    const response = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (response.ok) {
      void loadData();
    }
  }

  return (
    <section>
      <TopBar title="Budgets" subtitle="Set monthly limits and monitor spending." />
      <BudgetForm categories={categories} onCreated={loadData} />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p className="text-sm text-slate-400">Loading budgets...</p> : null}
        {!loading && budgets.length === 0 ? (
          <p className="text-sm text-slate-400">No budgets yet.</p>
        ) : null}
        {budgets.map((budget) => {
          const limit = Number(budget.amountLimit);
          const ratio = Math.min(100, Math.round((budget.spent / (limit || 1)) * 100));
          const warning = budget.warning as BudgetWarning;
          const warningTone = warningStyle[warning] ?? "text-slate-200 bg-slate-800";
          return (
            <article key={budget.id} className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-100">
                  {budget.category?.name ?? "Total Expense Budget"}
                </h2>
                <span className={`rounded px-2 py-1 text-xs font-medium ${warningTone}`}>
                  {budget.warning.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {formatCurrency(budget.spent)} of {formatCurrency(limit)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Prediksi akhir bulan: {formatCurrency(budget.predictedSpent)}
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${Math.max(0, Math.min(ratio, 100))}%` }}
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${predictiveStyle[budget.predictiveWarning]}`}
                >
                  {budget.predictiveWarning.replace("_", " ")}
                </span>
                <p className="text-right text-xs text-slate-300">{budget.predictiveMessage}</p>
              </div>
              <button
                onClick={() => removeBudget(budget.id)}
                className="mt-4 rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500"
              >
                Delete
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
