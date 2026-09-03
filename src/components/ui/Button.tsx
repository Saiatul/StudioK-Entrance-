import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "ghost" | "danger";
  loading?: boolean;
};

export function Button({
  variant = "gold",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: Props) {
  const styles =
    variant === "gold"
      ? "bg-gold text-ink shadow-[0_18px_40px_rgba(232,195,106,0.22)] hover:bg-gold-deep"
      : variant === "danger"
        ? "bg-transparent text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-500/10"
        : "bg-transparent text-cream ring-1 ring-line hover:bg-white/5";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex min-h-16 w-full items-center justify-center rounded-2xl px-6 text-lg font-semibold tracking-[0.18em] uppercase transition duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${styles} ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
