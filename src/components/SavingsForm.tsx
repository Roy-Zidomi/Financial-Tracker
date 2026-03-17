"use client";

import { useState } from "react";

type SavingsFormProps = {
  onCreated: () => void;
};

export function SavingsForm({ onCreated }: SavingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/savings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        targetAmount: Number(form.targetAmount),
        currentAmount: form.currentAmount ? Number(form.currentAmount) : 0,
        deadline: form.deadline || null,
      }),
    });

    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to save goal");
      return;
    }

    setForm({
      title: "",
      targetAmount: "",
      currentAmount: "",
      deadline: "",
    });
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Add Savings Goal</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <input
          type="text"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Goal title"
          aria-label="Goal title"
          title="Goal title"
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.targetAmount}
          onChange={(event) => setForm((prev) => ({ ...prev, targetAmount: event.target.value }))}
          placeholder="Target amount"
          aria-label="Target amount"
          title="Target amount"
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.currentAmount}
          onChange={(event) => setForm((prev) => ({ ...prev, currentAmount: event.target.value }))}
          placeholder="Current amount"
          aria-label="Current amount"
          title="Current amount"
          className="rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="date"
          aria-label="Deadline"
          title="Deadline"
          value={form.deadline}
          onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        className="accent-button w-fit rounded-lg px-4 py-2 text-sm transition disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Goal"}
      </button>
    </form>
  );
}
