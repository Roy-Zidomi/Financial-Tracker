import {
  ArrowRight,
  BadgeDollarSign,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  Wallet2,
} from "lucide-react";
import Link from "next/link";

const featureCards = [
  {
    title: "Smart Transaction Log",
    description: "Catat pemasukan dan pengeluaran dengan struktur rapi, lalu filter cepat per kategori.",
    icon: Wallet2,
  },
  {
    title: "Budget Radar",
    description: "Pantau seberapa dekat pengeluaran terhadap limit bulanan dengan indikator visual.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Savings Momentum",
    description: "Set target tabungan, lihat progres real-time, dan jaga konsistensi keuangan.",
    icon: BadgeDollarSign,
  },
];

const stats = [
  { label: "Budget Alerts", value: "80%+" },
  { label: "Export Ready", value: "PDF / CSV" },
  { label: "Realtime View", value: "24/7" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-16">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />
      <div className="bg-orb bg-orb-c" />

      <section className="surface-panel fade-up relative mx-auto grid w-full max-w-6xl gap-10 rounded-3xl p-8 md:grid-cols-[1.15fr_0.85fr] md:p-12">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/70 bg-cyan-900/20 px-3 py-1 text-xs tracking-[0.18em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            FINANCE TRACKER
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-100 md:text-6xl">
            Kendali keuangan yang terasa modern, cepat, dan jelas.
          </h1>
          <p className="max-w-xl text-slate-300 md:text-lg">
            Satu dashboard untuk transaksi, budget, dan tabungan. Fokus pada keputusan, bukan
            keribetan spreadsheet.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="accent-button inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition">
              Mulai Gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/50 px-5 py-3 text-sm font-medium text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Login
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((item, index) => (
              <article
                key={item.label}
                className={`stat-chip stagger-${index + 1}`}
              >
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{item.value}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="stagger-2 rounded-2xl border border-slate-700/80 bg-slate-950/70 p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Live Overview</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 px-2.5 py-1 text-xs text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure
            </span>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Balance</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-200">Rp 8.450.000</p>
              <p className="mt-2 text-xs text-slate-400">+12% dibanding bulan lalu</p>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Makan & Transport</span>
                <span className="text-slate-200">68%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 w-[68%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Savings Goal</span>
                <span className="text-slate-200">42%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 w-[42%] rounded-full bg-gradient-to-r from-amber-400 to-cyan-400" />
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto mt-8 grid w-full max-w-6xl gap-4 md:grid-cols-3">
        {featureCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className={`surface-panel card-hover rounded-2xl p-5 stagger-${index + 1}`}
            >
              <Icon className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="surface-panel mx-auto mt-8 w-full max-w-6xl rounded-2xl p-6 md:flex md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Ready to start</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">Bikin arus kasmu lebih disiplin hari ini.</h2>
        </div>
        <Link
          href="/register"
          className="accent-button mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition md:mt-0"
        >
          Buat Akun
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
