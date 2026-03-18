"use client";

import { FilterBar } from "@/components/FilterBar";
import { TopBar } from "@/components/TopBar";
import { TransactionForm } from "@/components/TransactionForm";
import { formatCurrency } from "@/lib/utils";
import { EntryType } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  type: EntryType;
};

type Transaction = {
  id: string;
  type: EntryType;
  amount: string | number;
  description: string | null;
  date: string;
  predictedCategoryLabel: string | null;
  isAutoCategorized: boolean;
  confidenceScore: string | number | null;
  isCorrectedByUser: boolean;
  category: {
    id: string;
    name: string;
    type: EntryType;
  } | null;
};

export default function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] = useState<Record<string, string>>({});

  const query = useMemo(() => (filterType ? `?type=${filterType}` : ""), [filterType]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const [categoriesRes, transactionsRes] = await Promise.all([
      fetch("/api/categories"),
      fetch(`/api/transactions${query}`),
    ]);

    if (!categoriesRes.ok || !transactionsRes.ok) {
      setLoading(false);
      setError("Failed to load transactions");
      return;
    }

    const categoriesPayload = (await categoriesRes.json()) as Category[];
    const transactionsPayload = (await transactionsRes.json()) as { items: Transaction[] };
    setCategories(categoriesPayload);
    setItems(transactionsPayload.items);
    setDraftCategory(
      transactionsPayload.items.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = item.category?.id ?? "";
        return acc;
      }, {}),
    );
    setLoading(false);
  }, [query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function removeItem(id: string) {
    const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (response.ok) {
      void loadData();
    }
  }

  async function updateCategory(item: Transaction) {
    const categoryId = draftCategory[item.id];
    if (!categoryId || categoryId === item.category?.id) {
      return;
    }

    setUpdatingId(item.id);
    const response = await fetch(`/api/transactions/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        isCorrectedByUser: true,
      }),
    });
    setUpdatingId(null);

    if (response.ok) {
      void loadData();
    }
  }

  return (
    <section>
      <TopBar title="Transactions" subtitle="Track income and expense records." />
      <TransactionForm categories={categories} onCreated={loadData} />
      <div className="mt-4">
        <FilterBar type={filterType} onTypeChange={setFilterType} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/70">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-300">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">AI</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={7}>
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-4 text-rose-600" colSpan={7}>
                  {error}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={7}>
                  No transactions yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-800/70 text-slate-200">
                  <td className="px-4 py-3">{new Date(item.date).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{item.category?.name ?? "-"}</span>
                      {item.isAutoCategorized ? (
                        <span className="rounded bg-cyan-900/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                          AI Categorized
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {item.isAutoCategorized ? (
                      <div className="space-y-1">
                        {item.predictedCategoryLabel ? (
                          <p>Predicted: {item.predictedCategoryLabel}</p>
                        ) : null}
                        <p>{Math.round(Number(item.confidenceScore ?? 0) * 100)}% confidence</p>
                        {item.isCorrectedByUser ? (
                          <p className="text-amber-300">Corrected by user</p>
                        ) : null}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">{item.description ?? "-"}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(item.amount))}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={draftCategory[item.id] ?? item.category?.id ?? ""}
                          onChange={(event) =>
                            setDraftCategory((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          className="rounded-lg px-2 py-1 text-xs text-slate-900"
                          title="Correct category"
                          aria-label="Correct category"
                        >
                          <option value="">No category</option>
                          {categories
                            .filter((category) => category.type === item.type)
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => updateCategory(item)}
                          className="rounded bg-cyan-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-cyan-600 disabled:opacity-60"
                          disabled={updatingId === item.id}
                        >
                          {updatingId === item.id ? "Saving..." : "Apply"}
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
