import { formatCurrency } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number;
  tone?: "neutral" | "income" | "expense";
};

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "border-slate-700/80 bg-slate-900/70",
  income: "border-emerald-700/50 bg-emerald-900/20",
  expense: "border-rose-700/50 bg-rose-900/20",
};

export function StatCard({ label, value, tone = "neutral" }: StatCardProps) {
  return (
    <article className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-100">{formatCurrency(value)}</p>
    </article>
  );
}
