"use client";

import Link from "next/link";
import { usePrinterStatus } from "@/lib/printer/use-printer-status";

/** Compact red/green printer status control. */
export function PrinterStatusChip() {
  const status = usePrinterStatus();
  const connected = status.state === "connected";

  return (
    <Link
      href="/printer"
      aria-label={connected ? "Printer connected" : "Printer disconnected"}
      title={connected ? "Printer connected" : "Printer disconnected"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
        connected
          ? "border-emerald-500/40 bg-emerald-500/15"
          : "border-rose-500/40 bg-rose-500/15"
      }`}
    >
      <span
        className={`h-3 w-3 rounded-full ${
          connected ? "bg-emerald-400" : "bg-rose-400"
        }`}
      />
    </Link>
  );
}
