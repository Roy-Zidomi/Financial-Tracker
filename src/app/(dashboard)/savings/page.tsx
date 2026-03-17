"use client";

import { SavingsForm } from "@/components/SavingsForm";
import { TopBar } from "@/components/TopBar";
import { formatCurrency } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

type SavingsGoal = {
  id: string;
  title: string;
  targetAmount: string | number;
  currentAmount: string | number;
  deadline: string | null;
  progress: number;
};

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/savings");
    if (response.ok) {
      const payload = (await response.json()) as SavingsGoal[];
      setGoals(payload);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function removeGoal(id: string) {
    const response = await fetch(`/api/savings/${id}`, { method: "DELETE" });
    if (response.ok) {
      void loadData();
    }
  }

  return (
    <section>
      <TopBar title="Savings Goals" subtitle="Track your progress toward every target." />
      <SavingsForm onCreated={loadData} />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p className="text-sm text-slate-400">Loading goals...</p> : null}
        {!loading && goals.length === 0 ? (
          <p className="text-sm text-slate-400">No savings goals yet.</p>
        ) : null}
        {goals.map((goal) => (
          <article key={goal.id} className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
            <h2 className="font-semibold text-slate-100">{goal.title}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {formatCurrency(Number(goal.currentAmount))} / {formatCurrency(Number(goal.targetAmount))}
            </p>
            <div className="mt-3 h-2 rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${Math.max(0, Math.min(goal.progress, 100))}%` }}
              />
            </div>
            {goal.deadline ? (
              <p className="mt-2 text-xs text-slate-400">
                Deadline: {new Date(goal.deadline).toLocaleDateString("id-ID")}
              </p>
            ) : null}
            <button
              onClick={() => removeGoal(goal.id)}
              className="mt-4 rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500"
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
