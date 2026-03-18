"use client";

import { formatCurrency } from "@/lib/utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ExpenseSlice = {
  name: string;
  value: number;
};

type TrendPoint = {
  month: string;
  income: number;
  expense: number;
  predictedExpense?: number;
};

const colors = ["#6cc8ff", "#f59e0b", "#2ad6c0", "#ef4444", "#0ea5e9", "#22c55e"];

function compactCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function toChartNumber(value: unknown) {
  if (Array.isArray(value)) {
    return toChartNumber(value[0]);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ExpensePieChart({ data }: { data: ExpenseSlice[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No expense data yet.</p>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <div className="relative h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={112}
              paddingAngle={2}
              cornerRadius={8}
              stroke="transparent"
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(toChartNumber(value))}
              contentStyle={{
                background: "#0f1725",
                border: "1px solid #2a3a53",
                borderRadius: "10px",
                color: "#e6eef8",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Expense</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">{formatCurrency(total)}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              {item.name}
            </span>
            <span className="text-slate-200">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlyTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No monthly trend data yet.</p>;
  }
  const hasPrediction = data.some((item) => typeof item.predictedExpense === "number");

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2ad6c0" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#2ad6c0" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="predictedExpenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#26364d" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#94a9c4", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#94a9c4", fontSize: 12 }}
            tickFormatter={(value) => compactCurrency(toChartNumber(value))}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => formatCurrency(toChartNumber(value))}
            contentStyle={{
              background: "#0f1725",
              border: "1px solid #2a3a53",
              borderRadius: "10px",
              color: "#e6eef8",
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ color: "#c5d4e7", fontSize: "12px" }} />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#2ad6c0"
            strokeWidth={2.5}
            fill="url(#incomeFill)"
            activeDot={{ r: 5, stroke: "#072230", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#ef4444"
            strokeWidth={2.5}
            fill="url(#expenseFill)"
            activeDot={{ r: 5, stroke: "#2a0808", strokeWidth: 2 }}
          />
          {hasPrediction ? (
            <Area
              type="monotone"
              dataKey="predictedExpense"
              name="Predicted Expense"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 5"
              fill="url(#predictedExpenseFill)"
              activeDot={{ r: 5, stroke: "#3b2b06", strokeWidth: 2 }}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
