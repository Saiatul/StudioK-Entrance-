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
      ? "bg-gold text-white hover:bg-gold-deep"
      : variant === "danger"
        ? "bg-transparent text-rose-300 ring-1 ring-rose-400/25"
        : "bg-panel text-cream";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex min-h-14 w-full items-center justify-center rounded-full px-6 text-[17px] font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${styles} ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
