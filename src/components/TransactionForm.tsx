"use client";

import { EntryType } from "@prisma/client";
import { useState } from "react";

type Category = {
  id: string;
  name: string;
  type: EntryType;
};

type TransactionFormProps = {
  categories: Category[];
  onCreated: () => void;
};

export function TransactionForm({ categories, onCreated }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<{
    type: EntryType;
    amount: string;
    description: string;
    categoryId: string;
    date: string;
  }>({
    type: EntryType.EXPENSE,
    amount: "",
    description: "",
    categoryId: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const filteredCategories = categories.filter((item) => item.type === form.type);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        categoryId: form.categoryId || undefined,
      }),
    });

    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to save transaction");
      return;
    }

    setForm({
      type: EntryType.EXPENSE,
      amount: "",
      description: "",
      categoryId: "",
      date: new Date().toISOString().slice(0, 10),
    });
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Add Transaction</h2>
      <div className="grid gap-3 md:grid-cols-5">
        <select
          value={form.type}
          onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as EntryType, categoryId: "" }))}
          className="rounded-lg px-3 py-2 text-sm"
          aria-label="Transaction type"
          title="Transaction type"
        >
          <option value={EntryType.EXPENSE}>Expense</option>
          <option value={EntryType.INCOME}>Income</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount"
          aria-label="Amount"
          title="Amount"
          value={form.amount}
          onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
        <select
          value={form.categoryId}
          onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          aria-label="Category"
          title="Category"
        >
          <option value="">No category</option>
          {filteredCategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Date"
          title="Date"
          value={form.date}
          onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          type="text"
          placeholder="Description"
          aria-label="Description"
          title="Description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        className="accent-button w-fit rounded-lg px-4 py-2 text-sm transition disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Transaction"}
      </button>
    </form>
  );
}
