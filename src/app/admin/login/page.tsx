"use client";

import { Suspense, useState } from "react";
import { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error || "Invalid email or password.");
        return;
      }

      const next = searchParams.get("next") || "/admin";
      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-[24px] border border-line bg-panel p-8"
    >
      <p className="text-sm font-medium text-gold">studioK</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-cream">
        Admin sign in
      </h1>
      <p className="mt-2 text-sm text-cream/50">
        Access is limited to authorized studioK hosts.
      </p>

      <label className="mt-8 block">
        <span className="field-label">Email</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-control w-full"
          placeholder="name@studiok.dev"
        />
      </label>

      <label className="mt-4 block">
        <span className="field-label">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-control w-full"
          placeholder="Password"
        />
      </label>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex min-h-14 w-full items-center justify-center rounded-full bg-gold text-[17px] font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <Suspense fallback={<p className="text-cream/50">Loading…</p>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
