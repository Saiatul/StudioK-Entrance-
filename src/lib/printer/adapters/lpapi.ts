import {
  PrinterError,
  type PrinterAdapter,
  type PrinterConnectionState,
} from "@/lib/printer/types";

const READY_KEY = "studiok.print.lpapi.ready";

function readReady() {
  try {
    return window.localStorage.getItem(READY_KEY) === "1";
  } catch {
    return false;
  }
}

function writeReady(ready: boolean) {
  try {
    if (ready) window.localStorage.setItem(READY_KEY, "1");
    else window.localStorage.removeItem(READY_KEY);
  } catch {
    /* ignore */
  }
}

/** Queue a print job on the server. Android app polls and prints once. */
async function enqueueJob(name: string, role: string) {
  const response = await fetch("/api/print-queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role }),
  });

  if (!response.ok) {
    throw new PrinterError(
      "print_failed",
      "Could not queue the badge for printing.",
    );
  }
}

export class LpapiCompanionAdapter implements PrinterAdapter {
  readonly id = "lpapi" as const;
  readonly label = "studioK Printer app";

  private state: PrinterConnectionState =
    typeof window !== "undefined" && readReady()
      ? "connected"
      : "disconnected";

  getState(): PrinterConnectionState {
    return this.state;
  }

  getDeviceName(): string | null {
    return this.state === "connected" ? "SEZNIK via studioK Printer" : null;
  }

  async connect(): Promise<void> {
    this.state = "connected";
    writeReady(true);
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
    writeReady(false);
  }

  async printBytes(_bytes: Uint8Array): Promise<void> {
    throw new PrinterError(
      "print_failed",
      "The studioK Printer app prints the badge directly.",
    );
  }

  async printGuest(name: string, role?: string): Promise<void> {
    // Queue only — no deep link (deep link + queue caused double prints;
    // deep-link-only stopped printing on the tablet).
    await enqueueJob(name, role ?? "");
    this.state = "connected";
    writeReady(true);
  }

  async printTest(): Promise<void> {
    await enqueueJob("TEST PRINT", "FOUNDER");
    this.state = "connected";
    writeReady(true);
  }
}
