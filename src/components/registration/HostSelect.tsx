"use client";

import { HOSTS } from "@/types/registration";

type Props = {
  value: string;
  onChange: (host: string) => void;
  error?: string;
};

export function HostSelect({ value, onChange, error }: Props) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium tracking-[0.18em] text-cream/70 uppercase">
        Host
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-16 w-full appearance-none rounded-2xl border bg-white/[0.04] px-5 pr-12 text-lg text-cream outline-none ${
            error ? "border-rose-400/70" : "border-line focus:border-gold/80"
          }`}
        >
          <option value="">Select Host</option>
          {HOSTS.map((host) => (
            <option key={host} value={host}>
              {host}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-gold">
          ▼
        </span>
      </div>
      {error ? <p className="mt-2 text-base text-rose-300">{error}</p> : null}
    </label>
  );
}
