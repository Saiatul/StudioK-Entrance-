import {
  PrinterError,
  type PrinterAdapter,
  type PrinterConnectionState,
} from "@/lib/printer/types";

const READY_KEY = "studiok.print.lpapi.ready";

function isAndroid() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

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

function launchCompanion(host: "connect" | "print" | "test" | "disconnect", query?: Record<string, string>) {
  const params = new URLSearchParams(query);
  const path = params.toString() ? `${host}?${params.toString()}` : host;
  const custom = `studiok://${path}`;
  const intent = `intent://${path}#Intent;scheme=studiok;package=dev.studiok.printer;end`;

  const href = isAndroid() ? intent : custom;
  const link = document.createElement("a");
  link.href = href;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export class LpapiCompanionAdapter implements PrinterAdapter {
  readonly id = "lpapi" as const;
  readonly label = "studioK Printer app";

  private state: PrinterConnectionState =
    typeof window !== "undefined" && isAndroid() && readReady()
      ? "connected"
      : "disconnected";

  getState(): PrinterConnectionState {
    if (typeof navigator === "undefined" || !isAndroid()) {
      return "unsupported";
    }
    return this.state;
  }

  getDeviceName(): string | null {
    return this.state === "connected" ? "SEZNIK via studioK Printer" : null;
  }

  async connect(): Promise<void> {
    if (!isAndroid()) {
      this.state = "unsupported";
      throw new PrinterError(
        "companion_unavailable",
        "Install the studioK Printer app on this Android tablet.",
      );
    }

    this.state = "connecting";
    launchCompanion("connect");
    this.state = "connected";
    writeReady(true);
  }

  async disconnect(): Promise<void> {
    if (isAndroid()) {
      launchCompanion("disconnect");
    }
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
    if (!isAndroid()) {
      throw new PrinterError(
        "companion_unavailable",
        "Install the studioK Printer app on this Android tablet.",
      );
    }

    const query: Record<string, string> = { name };
    if (role) query.role = role;
    launchCompanion("print", query);
    this.state = "connected";
    writeReady(true);
  }

  async printTest(): Promise<void> {
    if (!isAndroid()) {
      throw new PrinterError(
        "companion_unavailable",
        "Install the studioK Printer app on this Android tablet.",
      );
    }

    launchCompanion("test");
    this.state = "connected";
    writeReady(true);
  }
}
