"use client";

import { signOut } from "next-auth/react";

type TopBarProps = {
  title: string;
  subtitle?: string;
  userName?: string | null;
};

export function TopBar({ title, subtitle, userName }: TopBarProps) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800/80 pb-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-sm text-slate-300">
          {userName ?? "User"}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
