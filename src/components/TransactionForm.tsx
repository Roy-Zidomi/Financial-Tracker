"use client";

import { EntryType } from "@prisma/client";
import { useEffect, useState } from "react";

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
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [suggestion, setSuggestion] = useState<{
    predictedLabel: string;
    confidenceScore: number;
    categoryId: string | null;
    categoryName: string;
  } | null>(null);
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

  useEffect(() => {
    const description = form.description.trim();
    if (description.length < 3) {
      return;
    }
    if (form.categoryId) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSuggesting(true);
      setSuggestionError("");

      const response = await fetch("/api/ml/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          type: form.type,
        }),
      });

      if (cancelled) {
        return;
      }
      setSuggesting(false);
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setSuggestionError(payload.error ?? "Failed to get AI suggestion");
        return;
      }

      const payload = (await response.json()) as {
        predictedLabel: string;
        confidenceScore: number;
        categoryId: string | null;
        categoryName: string;
      };
      setSuggestion(payload);
      if (payload.categoryId) {
        setForm((prev) => (prev.categoryId ? prev : { ...prev, categoryId: payload.categoryId! }));
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.description, form.type, form.categoryId]);

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
        isCorrectedByUser: Boolean(
          suggestion?.categoryId && form.categoryId && suggestion.categoryId !== form.categoryId,
        ),
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
    setSuggestion(null);
    setSuggestionError("");
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Add Transaction</h2>
      <div className="grid gap-3 md:grid-cols-5">
        <select
          value={form.type}
          onChange={(event) => {
            setForm((prev) => ({ ...prev, type: event.target.value as EntryType, categoryId: "" }));
            setSuggestion(null);
          }}
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
          onChange={(event) => {
            setForm((prev) => ({ ...prev, description: event.target.value }));
            setSuggestion(null);
            setSuggestionError("");
          }}
          className="rounded-lg px-3 py-2 text-sm"
        />
      </div>
      {suggesting ? <p className="text-xs text-cyan-300">AI is categorizing this transaction...</p> : null}
      {suggestion ? (
        <p className="text-xs text-slate-300">
          AI suggestion: <span className="font-semibold text-slate-100">{suggestion.categoryName}</span>{" "}
          ({Math.round(suggestion.confidenceScore * 100)}%)
        </p>
      ) : null}
      {suggestionError ? <p className="text-xs text-amber-400">{suggestionError}</p> : null}
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
