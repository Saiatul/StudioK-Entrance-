"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, type Country } from "@/lib/countries";

type Props = {
  value: Country;
  onChange: (country: Country) => void;
  error?: string;
};

export function CountrySelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`field-control flex min-w-[7.25rem] items-center justify-between gap-2 px-4 ${
          error || open ? "border-gold/80" : ""
        }`}
        aria-expanded={open}
        aria-label="Country code"
      >
        <span className="font-medium">{value.dial}</span>
        <span
          className={`text-cream/40 transition ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] left-0 z-40 w-[min(22rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#2c2c2e] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          <div className="border-b border-white/10 p-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-[15px] text-cream outline-none placeholder:text-cream/30 focus:border-gold/70"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.map((country) => {
              const selected = country.dial === value.dial && country.iso === value.iso;
              return (
                <button
                  type="button"
                  key={`${country.iso}-${country.dial}`}
                  className={`flex min-h-12 w-full items-center justify-between px-4 text-left text-[16px] ${
                    selected ? "bg-gold/15" : "hover:bg-white/[0.06]"
                  }`}
                  onClick={() => {
                    onChange(country);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="text-cream">{country.name}</span>
                  <span className="font-medium text-gold">{country.dial}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
