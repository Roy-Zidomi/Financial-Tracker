"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-100">Login</h1>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          type="email"
          placeholder="Email"
          aria-label="Email"
          title="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          aria-label="Password"
          title="Password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="accent-button rounded-lg px-4 py-2 text-sm transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-slate-300">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-sky-300 underline">
          Register
        </Link>
      </p>
    </section>
  );
}
