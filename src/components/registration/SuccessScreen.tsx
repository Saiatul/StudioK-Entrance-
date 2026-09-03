"use client";

import { Button } from "@/components/ui/Button";

type Phase = "printing" | "printed" | "print-failed";

type Props = {
  name: string;
  phase: Phase;
  printError?: string;
  onDone: () => void;
  onRetry: () => void;
  retrying?: boolean;
};

export function SuccessScreen({
  name,
  phase,
  printError,
  onDone,
  onRetry,
  retrying = false,
}: Props) {
  const firstName = name.trim().split(/\s+/)[0] || "guest";

  return (
    <section className="flex min-h-[62dvh] flex-col items-center justify-center text-center">
      <p className="text-[13px] font-medium text-gold">
        {phase === "printed" ? "Badge printed" : "Registered"}
      </p>
      <h2 className="mt-3 text-[40px] leading-tight font-semibold tracking-tight text-cream sm:text-5xl">
        Welcome, {firstName}
      </h2>
      <p className="mt-4 max-w-sm text-[17px] text-cream/60">
        {phase === "printing"
          ? "Printing your badge..."
          : phase === "printed"
            ? "You are all set."
            : printError ||
              "Registration saved successfully, but the badge could not be printed."}
      </p>

      {phase === "printing" ? (
        <div className="mt-10 h-2 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="gold-progress h-full w-1/2 rounded-full bg-gold" />
        </div>
      ) : null}

      {phase === "print-failed" ? (
        <div className="mt-10 flex w-full max-w-md flex-col gap-3">
          <Button onClick={onRetry} loading={retrying}>
            Retry Print
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Done
          </Button>
        </div>
      ) : null}

      {phase === "printed" ? (
        <div className="mt-10 w-full max-w-md">
          <Button onClick={onDone}>Done</Button>
        </div>
      ) : null}
    </section>
  );
}
