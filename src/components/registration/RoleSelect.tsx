"use client";

import { useEffect, useRef, useState } from "react";
import { ROLES } from "@/types/registration";

type Props = {
  value: string;
  onChange: (role: string) => void;
  error?: string;
};

export function RoleSelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={rootRef} className="relative block">
      <span className="field-label">Role</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`field-control flex w-full items-center justify-between pr-5 ${
          error || open ? "border-gold/80" : ""
        } ${value ? "text-cream" : "text-cream/30"}`}
        aria-expanded={open}
      >
        <span>{value || "Select role"}</span>
        <span className={`text-cream/40 transition ${open ? "rotate-180" : ""}`}>
          ⌄
        </span>
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#2c2c2e] py-1 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          {ROLES.map((role) => {
            const selected = role === value;
            return (
              <button
                type="button"
                key={role}
                className={`flex min-h-12 w-full items-center px-5 text-left text-[16px] ${
                  selected ? "bg-gold/15 text-gold" : "text-cream hover:bg-white/[0.06]"
                }`}
                onClick={() => {
                  onChange(role);
                  setOpen(false);
                }}
              >
                {role}
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[15px] text-rose-300">{error}</p> : null}
    </div>
  );
}
