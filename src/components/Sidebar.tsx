"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  HandCoins,
  Menu,
  House,
  PiggyBank,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/budgets", label: "Budgets", icon: BarChart3 },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  userName?: string | null;
  userEmail?: string | null;
};

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  const content = (
    <>
      <div className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-100">
        <HandCoins className="h-5 w-5 text-cyan-300" />
        Finance Tracker
      </div>
      <nav className="grid gap-2 md:mb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-cyan-400/20 text-cyan-200"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <details className="group relative mt-4 md:mt-auto">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/70">
          <span className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-cyan-300" />
            Profil
          </span>
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>

        <div className="mt-2 rounded-xl border border-slate-800/80 bg-slate-900/95 p-2 shadow-lg">
          <div className="mb-1 rounded-lg border border-slate-800/80 bg-slate-950/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Informasi akun</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{userName ?? "User"}</p>
            <p className="text-xs text-slate-400">{userEmail ?? "No email"}</p>
          </div>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/80"
          >
            Settings
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 w-full rounded-lg bg-rose-600/85 px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-rose-500"
          >
            Logout
          </button>
        </div>
      </details>
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-2 text-slate-100 transition hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <HandCoins className="h-4.5 w-4.5 text-cyan-300" />
            Finance Tracker
          </div>
          <span className="w-9" />
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setIsOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-[84vw] max-w-80 border-r border-slate-800/90 bg-slate-950/96 p-4 shadow-2xl transition-transform duration-300 ease-out",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Navigation</p>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-1.5 text-slate-200 transition hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex h-[calc(100%-2.5rem)] flex-col">{content}</div>
        </aside>
      </div>

      <aside className="hidden w-full border-b border-slate-800/80 bg-slate-950/80 p-4 text-slate-100 backdrop-blur md:flex md:h-screen md:w-72 md:flex-col md:border-b-0 md:border-r">
        {content}
      </aside>
    </>
  );
}
