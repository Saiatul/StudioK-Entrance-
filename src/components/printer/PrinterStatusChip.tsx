"use client";

import Link from "next/link";
import { usePrinterStatus } from "@/lib/printer/use-printer-status";

export function PrinterStatusChip() {
  const status = usePrinterStatus();
  const connected = status.state === "connected";

  return (
    <Link
      href="/printer"
      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 text-sm tracking-[0.16em] uppercase"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          connected ? "bg-emerald-400" : "bg-rose-400"
        }`}
      />
      <span className="text-cream/80">
        {connected ? "Printer connected" : "Printer disconnected"}
      </span>
    </Link>
  );
}
