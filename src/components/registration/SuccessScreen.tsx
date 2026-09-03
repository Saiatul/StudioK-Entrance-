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
    <section className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <p className="text-sm tracking-[0.4em] text-gold uppercase">
        {phase === "printed" ? "Badge Printed" : "Registration Successful"}
      </p>
      <h2 className="font-display mt-5 text-5xl font-extrabold text-cream sm:text-6xl">
        Welcome, {firstName}!
      </h2>
      <p className="mt-5 max-w-md text-xl text-cream/70">
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
