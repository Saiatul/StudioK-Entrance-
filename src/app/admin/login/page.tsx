"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error || "Invalid email or password.");
        return;
      }

      const next = searchParams.get("next") || "/admin";
      const target = next.startsWith("/admin") ? next : "/admin";
      // Hard navigation so the new auth cookie is definitely applied
      window.location.assign(target);
    } catch {
      setError("Unable to sign in. Please try again.");
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

      <div className="mt-4">
        <span className="field-label">Password</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-control w-full pr-20"
            placeholder="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-medium text-cream/60 transition hover:text-cream"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

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
