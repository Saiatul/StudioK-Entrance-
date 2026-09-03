"use client";

import { useMemo, useState } from "react";
import { COUNTRIES, type Country } from "@/lib/countries";

type Props = {
  value: Country;
  onChange: (country: Country) => void;
  error?: string;
};

export function CountrySelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return COUNTRIES;
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.dial.includes(needle) ||
        country.iso.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-16 min-w-[7.5rem] items-center justify-between gap-3 rounded-2xl border bg-white/[0.04] px-4 text-lg text-cream ${
          error ? "border-rose-400/70" : "border-line"
        }`}
        aria-label="Country code"
      >
        <span className="font-semibold">{value.dial}</span>
        <span className="text-gold">▼</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[80dvh] w-full max-w-lg overflow-hidden rounded-[28px] border border-line bg-panel shadow-2xl">
            <div className="border-b border-line px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl text-cream">Country code</h2>
                <button
                  type="button"
                  className="text-sm tracking-[0.2em] text-gold uppercase"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country"
                className="h-14 w-full rounded-2xl border border-line bg-white/[0.04] px-4 text-lg text-cream outline-none"
              />
            </div>
            <div className="max-h-[52dvh] overflow-y-auto">
              {filtered.map((country) => (
                <button
                  type="button"
                  key={`${country.iso}-${country.dial}`}
                  className="flex min-h-16 w-full items-center justify-between px-5 text-left text-lg text-cream hover:bg-white/[0.05]"
                  onClick={() => {
                    onChange(country);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span>{country.name}</span>
                  <span className="font-semibold text-gold">{country.dial}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
