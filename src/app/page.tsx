import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <section className="surface-panel fade-up mx-auto grid w-full max-w-6xl gap-8 rounded-3xl p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
        <div className="space-y-6 fade-up-delay">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300/80">
            Personal Finance Tracker
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-slate-100 md:text-5xl">
            Stay in control of your money with one clear dashboard.
          </h1>
          <p className="max-w-xl text-slate-300">
            Track income and expenses, set budgets, and monitor savings goals from a single app
            built for day-to-day decisions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="accent-button rounded-xl px-5 py-3 text-sm transition"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 bg-slate-900/50 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
            >
              Login
            </Link>
          </div>
        </div>
        <div className="fade-up rounded-2xl border border-cyan-900/70 bg-slate-950/70 p-6 text-slate-100">
          <h2 className="text-xl font-semibold">Core features</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>Income and expense transaction tracking</li>
            <li>Monthly budget targets with warning levels</li>
            <li>Savings goals and progress monitoring</li>
            <li>Export reports to PDF and import CSV data</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
