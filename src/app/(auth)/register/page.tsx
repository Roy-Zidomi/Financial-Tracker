"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setLoading(false);
      setError(payload.error ?? "Registration failed");
      return;
    }

    const loginResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);

    if (loginResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-100">Register</h1>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          type="text"
          placeholder="Name"
          aria-label="Name"
          title="Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          required
        />
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
          placeholder="Password (min 8 chars)"
          aria-label="Password"
          title="Password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          className="rounded-lg px-3 py-2 text-sm"
          minLength={8}
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="accent-button rounded-lg px-4 py-2 text-sm transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="text-sm text-slate-300">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-sky-300 underline">
          Login
        </Link>
      </p>
    </section>
  );
}
