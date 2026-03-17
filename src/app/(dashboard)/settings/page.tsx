"use client";

import { TopBar } from "@/components/TopBar";
import { EntryType } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  type: EntryType;
  isDefault: boolean;
  userId: string | null;
};

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<EntryType>(EntryType.EXPENSE);

  const loadData = useCallback(async () => {
    const response = await fetch("/api/categories");
    if (response.ok) {
      const payload = (await response.json()) as Category[];
      setCategories(payload);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    if (response.ok) {
      setName("");
      void loadData();
    }
  }

  async function removeCategory(id: string) {
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (response.ok) {
      void loadData();
    }
  }

  function openPdfExport() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    window.open(`/api/export/pdf?month=${month}&year=${year}`, "_blank");
  }

  return (
    <section>
      <TopBar title="Settings" subtitle="Manage categories and reports." />
      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Category Management</h2>
          <form onSubmit={addCategory} className="mt-3 flex flex-wrap gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Category name"
              aria-label="Category name"
              title="Category name"
              className="flex-1 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value as EntryType)}
              className="rounded-lg px-3 py-2 text-sm"
              aria-label="Category type"
              title="Category type"
            >
              <option value={EntryType.EXPENSE}>Expense</option>
              <option value={EntryType.INCOME}>Income</option>
            </select>
            <button className="accent-button rounded-lg px-4 py-2 text-sm">
              Add
            </button>
          </form>
          <div className="mt-4 grid gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
              >
                <span>
                  {category.name} ({category.type})
                </span>
                {category.isDefault ? (
                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">Default</span>
                ) : (
                  <button
                    onClick={() => removeCategory(category.id)}
                    className="rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Export Report</h2>
          <p className="mt-2 text-sm text-slate-300">
            Download a monthly transactions report as PDF.
          </p>
          <button
            onClick={openPdfExport}
            className="accent-button mt-4 rounded-lg px-4 py-2 text-sm"
          >
            Export Current Month PDF
          </button>
        </article>
      </div>
    </section>
  );
}
