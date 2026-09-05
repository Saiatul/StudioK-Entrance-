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

/** Fire the deep link via hidden iframe (won't navigate away). */
function launchCompanion(host: string, query?: Record<string, string>) {
  const params = new URLSearchParams(query);
  const path = params.toString() ? `${host}?${params.toString()}` : host;
  const href = `studiok://${path}`;

  if (typeof document !== "undefined") {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = href;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {
        /* ignore */
      }
    }, 2000);
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
    // Only deep link — do NOT also enqueue (that caused double prints on tablet)
    const query: Record<string, string> = { name };
    if (role) query.role = role;
    launchCompanion("print", query);
    this.state = "connected";
    writeReady(true);
  }

  async printTest(): Promise<void> {
    launchCompanion("test");
    this.state = "connected";
    writeReady(true);
  }
}
