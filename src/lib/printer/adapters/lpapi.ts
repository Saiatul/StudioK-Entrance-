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

/** Wake the Android printer app so it polls immediately (does not print). */
function wakeCompanion() {
  if (typeof document === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = "studiok://wake";
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch {
      /* ignore */
    }
  }, 2000);
}

/** Queue a print job on the server. Android app polls and prints once. */
async function enqueueJob(name: string, role: string) {
  const response = await fetch("/api/print-queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new PrinterError(
      "print_failed",
      text || "Could not queue the badge for printing.",
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
    wakeCompanion();
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
    wakeCompanion();
    this.state = "connected";
    writeReady(true);
  }

  async printTest(): Promise<void> {
    await enqueueJob("TEST PRINT", "FOUNDER");
    wakeCompanion();
    this.state = "connected";
    writeReady(true);
  }
}
