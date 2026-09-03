import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ label, error, id, className = "", ...props }: Props) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium tracking-[0.18em] text-cream/70 uppercase">
        {label}
      </span>
      <input
        id={id}
        {...props}
        className={`h-16 w-full rounded-2xl border bg-white/[0.04] px-5 text-lg text-cream outline-none transition placeholder:text-cream/25 ${
          error
            ? "border-rose-400/70"
            : "border-line focus:border-gold/80 focus:bg-white/[0.06]"
        } ${className}`}
      />
      {error ? <p className="mt-2 text-base text-rose-300">{error}</p> : null}
    </label>
  );
}
