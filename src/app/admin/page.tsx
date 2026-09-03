"use client";

import { useEffect, useState } from "react";

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
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/registrations")
      .then((r) => r.json())
      .then((d) => setRows(d.registrations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter((r) => {
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cream">
            <span className="text-gold">studioK</span> Admin
          </h1>
          <p className="mt-1 text-sm text-cream/50">
            {rows.length} registration{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetch("/api/admin/registrations")
              .then((r) => r.json())
              .then((d) => setRows(d.registrations ?? []))
              .catch(() => {})
              .finally(() => setLoading(false));
          }}
          className="rounded-lg bg-panel px-4 py-2 text-sm text-cream hover:bg-panel/80 transition"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, mobile, email, role, host…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-line bg-panel px-4 py-3 text-cream placeholder:text-cream/30 outline-none focus:border-gold"
      />

      {/* Table */}
      {loading ? (
        <p className="text-cream/50 text-center py-12">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-cream/60 text-xs uppercase tracking-wider">
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
                  <td colSpan={8} className="px-4 py-8 text-center text-cream/40">
                    {search ? "No matches" : "No registrations yet"}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-panel/50 transition">
                    <td className="px-4 py-3 text-cream/40">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-cream">{r.name}</td>
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
                    <td className="px-4 py-3 text-cream/50 text-xs">
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
