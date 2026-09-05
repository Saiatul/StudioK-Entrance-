"use client";

import { useEffect, useRef, useState } from "react";
import { HOSTS } from "@/types/registration";

type Props = {
  value: string;
  onChange: (host: string) => void;
  error?: string;
};

type HostOption = { name: string; email?: string };

export function HostSelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [hosts, setHosts] = useState<HostOption[]>(
    HOSTS.map((name) => ({ name })),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hosts")
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          payload: {
            hosts?: Array<{ name: string; email?: string }>;
          } | null,
        ) => {
          if (!cancelled && payload?.hosts?.length) {
            setHosts(
              payload.hosts.map((h) => ({ name: h.name, email: h.email })),
            );
          }
        },
      )
      .catch(() => {
        /* keep built-in hosts */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={rootRef} className="relative block">
      <span className="field-label">Host</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`field-control flex w-full items-center justify-between pr-5 ${
          error || open ? "border-gold/80" : ""
        } ${value ? "text-cream" : "text-cream/30"}`}
        aria-expanded={open}
      >
        <span>{value || "Select host"}</span>
        <span className={`text-cream/40 transition ${open ? "rotate-180" : ""}`}>
          ⌄
        </span>
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#2c2c2e] py-1 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          {hosts.map((host) => {
            const selected = host.name === value;
            return (
              <button
                type="button"
                key={host.name}
                className={`flex min-h-12 w-full flex-col items-start justify-center px-5 py-2 text-left ${
                  selected
                    ? "bg-gold/15 text-gold"
                    : "text-cream hover:bg-white/[0.06]"
                }`}
                onClick={() => {
                  onChange(host.name);
                  setOpen(false);
                }}
              >
                <span className="text-[16px]">{host.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[15px] text-rose-300">{error}</p> : null}
    </div>
  );
}
