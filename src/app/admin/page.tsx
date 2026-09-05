"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HOSTS, ROLES } from "@/types/registration";

type Row = {
  id: number;
  name: string;
  country_code: string;
  mobile: string;
  email: string;
  host: string;
  role: string | null;
  legal_accepted: boolean;
  registered_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [hostFilter, setHostFilter] = useState("all");

  function load() {
    setLoading(true);
    fetch("/api/admin/registrations")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/admin/login");
          return { registrations: [] };
        }
        return r.json();
      })
      .then((d) => setRows(d.registrations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    load();
  }, []);

  const roleOptions = useMemo(() => {
    const fromData = rows
      .map((r) => r.role)
      .filter((r): r is string => Boolean(r && r.trim()));
    return Array.from(new Set([...ROLES, ...fromData])).sort();
  }, [rows]);

  const hostOptions = useMemo(() => {
    const fromData = rows
      .map((r) => r.host)
      .filter((h) => Boolean(h && h.trim()));
    return Array.from(new Set([...HOSTS, ...fromData])).sort();
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (roleFilter !== "all" && (r.role ?? "") !== roleFilter) return false;
    if (hostFilter !== "all" && r.host !== hostFilter) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.mobile.includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.role ?? "").toLowerCase().includes(q) ||
      r.host.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-ink p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">
            <span className="text-gold">studioK</span> Admin
          </h1>
          <p className="mt-1 text-sm text-cream/50">
            {filtered.length} of {rows.length} registration
            {rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={signOut}
            className="rounded-lg bg-panel px-4 py-2 text-sm text-cream/70 transition hover:bg-panel/80"
          >
            Sign out
          </button>
          <button
            onClick={load}
            className="rounded-lg bg-panel px-4 py-2 text-sm text-cream transition hover:bg-panel/80"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Search by name, mobile, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel px-4 py-3 text-cream outline-none placeholder:text-cream/30 focus:border-gold sm:col-span-1"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full appearance-none rounded-lg border border-line bg-panel px-4 py-3 text-cream outline-none focus:border-gold"
        >
          <option value="all">All roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          value={hostFilter}
          onChange={(e) => setHostFilter(e.target.value)}
          className="w-full appearance-none rounded-lg border border-line bg-panel px-4 py-3 text-cream outline-none focus:border-gold"
        >
          <option value="all">All hosts</option>
          {hostOptions.map((host) => (
            <option key={host} value={host}>
              {host}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-12 text-center text-cream/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-xs uppercase tracking-wider text-cream/60">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Host</th>
                <th className="px-4 py-3">Legal</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-cream/40"
                  >
                    {search || roleFilter !== "all" || hostFilter !== "all"
                      ? "No matches"
                      : "No registrations yet"}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-panel/50">
                    <td className="px-4 py-3 text-cream/40">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-cream">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-cream/80">
                      {r.country_code} {r.mobile}
                    </td>
                    <td className="px-4 py-3 text-cream/80">{r.email}</td>
                    <td className="px-4 py-3">
                      {r.role ? (
                        <span className="inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-medium text-gold">
                          {r.role}
                        </span>
                      ) : (
                        <span className="text-cream/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-cream/80">{r.host}</td>
                    <td className="px-4 py-3">
                      {r.legal_accepted ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-cream/50">
                      {new Date(r.registered_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
