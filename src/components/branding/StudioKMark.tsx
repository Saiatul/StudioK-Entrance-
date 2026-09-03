"use client";

export function StudioKMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 72"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="3"
        width="66"
        height="66"
        rx="8"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M22 46c0-8 6.2-12 14.8-12H42M22 26h16.4C47.2 26 52 30.4 52 36.6c0 4.4-2.4 7.6-6.4 9.2L52 50"
        stroke="currentColor"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StudioKWordmark({
  subtitle,
}: {
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-3 text-gold">
        <StudioKMark className="h-11 w-11" />
        <span className="font-display text-4xl font-extrabold tracking-[0.22em] text-cream sm:text-5xl">
          STUDIOK
        </span>
      </div>
      {subtitle ? (
        <p className="mt-3 text-[0.7rem] font-semibold tracking-[0.55em] text-gold/80 sm:text-xs">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
