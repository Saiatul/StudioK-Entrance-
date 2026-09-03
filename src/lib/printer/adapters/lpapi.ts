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

/** Send a print job to the server queue — the Android app polls for it. */
async function enqueueJob(name: string, role: string) {
  await fetch("/api/print-queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role }),
  });
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
