"use client";

export function StudioKMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 88"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="18"
        y="38"
        width="52"
        height="18"
        rx="9"
        fill="white"
        transform="rotate(-32 44 47)"
      />
      <circle cx="58" cy="26" r="9" fill="#E07030" />
      <path
        d="M58 8v8M70 14l-6 6M74 26h-8M70 38l-6-6M46 14l6 6"
        stroke="#E07030"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StudioKWordmark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <img
        src="/branding/studiok-logo.png"
        alt="studioK"
        className="h-28 w-auto object-contain sm:h-32"
      />
      {subtitle ? (
        <p className="mt-3 text-[15px] font-medium text-gold">{subtitle}</p>
      ) : null}
    </div>
  );
}
