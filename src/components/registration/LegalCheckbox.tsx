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
      <div className="flex items-start gap-4 rounded-[18px] bg-black/35 p-4">
        <input
          id="legal-accepted"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-6 w-6 shrink-0 accent-[#e07030]"
        />
        <p className="text-[16px] leading-relaxed text-cream/80">
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
      {error ? <p className="mt-2 text-[15px] text-rose-300">{error}</p> : null}
    </div>
  );
}
