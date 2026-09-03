"use client";

import Link from "next/link";
import { usePrinterStatus } from "@/lib/printer/use-printer-status";

export function PrinterStatusChip() {
  const status = usePrinterStatus();
  const connected = status.state === "connected";

  return (
    <Link
      href="/printer"
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-panel px-4 text-[13px] font-medium"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? "bg-emerald-400" : "bg-white/25"
        }`}
      />
      <span className="text-cream/70">
        {connected
          ? status.adapterId === "lpapi"
            ? "Printer app ready"
            : "Printer connected"
          : "Printer"}
      </span>
    </Link>
  );
}
