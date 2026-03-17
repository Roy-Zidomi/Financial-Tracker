"use client";

import { EntryType } from "@prisma/client";
import { useState } from "react";

type Category = {
  id: string;
  name: string;
  type: EntryType;
};

type BudgetFormProps = {
  categories: Category[];
  onCreated: () => void;
};

export function BudgetForm({ categories, onCreated }: BudgetFormProps) {
  const now = new Date();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    categoryId: "",
    amountLimit: "",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: form.categoryId || null,
        amountLimit: Number(form.amountLimit),
        month: Number(form.month),
        year: Number(form.year),
      }),
    });

    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to save budget");
      return;
    }

    setForm((prev) => ({ ...prev, amountLimit: "" }));
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Set Budget</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <select
          id="budget-category"
          value={form.categoryId}
          onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          aria-label="Budget category"
          title="Budget category"
        >
          <option value="">Total Expense</option>
          {categories
            .filter((item) => item.type === EntryType.EXPENSE)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
        <input
          id="budget-limit"
          type="number"
          step="0.01"
          min="0"
          placeholder="Limit amount"
          aria-label="Limit amount"
          title="Limit amount"
          value={form.amountLimit}
          onChange={(event) => setForm((prev) => ({ ...prev, amountLimit: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          aria-describedby="budget-limit-help"
          required
        />
        <input
          id="budget-month"
          type="number"
          min="1"
          max="12"
          placeholder="Month"
          aria-label="Month"
          title="Month"
          value={form.month}
          onChange={(event) => setForm((prev) => ({ ...prev, month: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          id="budget-year"
          type="number"
          min="2020"
          max="2100"
          placeholder="Year"
          aria-label="Year"
          title="Year"
          value={form.year}
          onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
      </div>
      <p id="budget-limit-help" className="text-xs text-slate-400">
        Limit amount adalah batas maksimal pengeluaran untuk kategori (atau total expense) pada
        bulan dan tahun yang dipilih.
      </p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        className="accent-button w-fit rounded-lg px-4 py-2 text-sm transition disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Budget"}
      </button>
    </form>
  );
}
