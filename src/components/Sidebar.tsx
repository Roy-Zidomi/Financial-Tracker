"use client";

import { cn } from "@/lib/utils";
import { BarChart3, CreditCard, HandCoins, House, PiggyBank, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/budgets", label: "Budgets", icon: BarChart3 },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-800/80 bg-slate-950/80 p-4 text-slate-100 backdrop-blur md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-100">
        <HandCoins className="h-5 w-5 text-cyan-300" />
        Finance Tracker
      </div>
      <nav className="grid gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
