import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ label, error, id, className = "", ...props }: Props) {
  return (
    <label className="block" htmlFor={id}>
      <span className="field-label">{label}</span>
      <input
        id={id}
        {...props}
        className={`field-control w-full ${
          error ? "border-rose-400/70" : ""
        } ${className}`}
      />
      {error ? <p className="mt-2 text-[15px] text-rose-300">{error}</p> : null}
    </label>
  );
}
