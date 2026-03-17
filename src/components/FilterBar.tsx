"use client";

import { EntryType } from "@prisma/client";

type FilterBarProps = {
  type: string;
  onTypeChange: (value: string) => void;
};

export function FilterBar({ type, onTypeChange }: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
      <label className="text-sm text-slate-300" htmlFor="type-filter">
        Type
      </label>
      <select
        id="type-filter"
        value={type}
        onChange={(event) => onTypeChange(event.target.value)}
        className="rounded-lg px-3 py-2 text-sm"
      >
        <option value="">All</option>
        <option value={EntryType.INCOME}>Income</option>
        <option value={EntryType.EXPENSE}>Expense</option>
      </select>
    </div>
  );
}
