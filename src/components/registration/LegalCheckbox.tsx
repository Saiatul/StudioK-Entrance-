"use client";

import type { LegalDoc } from "@/components/registration/LegalDialog";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onOpenDoc: (doc: LegalDoc) => void;
  error?: string;
};

export function LegalCheckbox({ checked, onChange, onOpenDoc, error }: Props) {
  return (
    <div>
      <div className="flex items-start gap-4 rounded-2xl border border-line bg-white/[0.03] p-4">
        <input
          id="legal-accepted"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-7 w-7 shrink-0 accent-[#e8c36a]"
        />
        <p className="text-lg leading-relaxed text-cream/85">
          <label htmlFor="legal-accepted" className="cursor-pointer">
            I agree to the{" "}
          </label>
          <button
            type="button"
            className="text-gold underline underline-offset-4"
            onClick={() => onOpenDoc("terms")}
          >
            Terms & Conditions
          </button>
          ,{" "}
          <button
            type="button"
            className="text-gold underline underline-offset-4"
            onClick={() => onOpenDoc("privacy")}
          >
            Privacy Policy
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="text-gold underline underline-offset-4"
            onClick={() => onOpenDoc("liability")}
          >
            Liability Waiver
          </button>
          .
        </p>
      </div>
      {error ? <p className="mt-2 text-base text-rose-300">{error}</p> : null}
    </div>
  );
}
