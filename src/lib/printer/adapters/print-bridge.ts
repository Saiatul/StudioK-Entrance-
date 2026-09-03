import {
  PrinterError,
  type PrinterAdapter,
  type PrinterConnectionState,
} from "@/lib/printer/types";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export class PrintBridgeAdapter implements PrinterAdapter {
  readonly id = "print-bridge" as const;
  readonly label = "Local print bridge";

  private state: PrinterConnectionState = "disconnected";
  private bridgeUrl: string;

  constructor(bridgeUrl = "http://127.0.0.1:9100") {
    this.bridgeUrl = bridgeUrl.replace(/\/$/, "");
  }

  setBridgeUrl(url: string) {
    this.bridgeUrl = url.replace(/\/$/, "");
  }

  getState(): PrinterConnectionState {
    return this.state;
  }

  getDeviceName(): string | null {
    return this.state === "connected" ? "Print bridge" : null;
  }

  async connect(): Promise<void> {
    this.state = "connecting";

    try {
      const response = await fetch(`${this.bridgeUrl}/status`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Bridge status failed.");
      }

      this.state = "connected";
    } catch {
      this.state = "disconnected";
      throw new PrinterError(
        "bridge_unavailable",
        "The local print bridge is not available.",
      );
    }
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
  }

  async printBytes(bytes: Uint8Array): Promise<void> {
    if (this.state !== "connected") {
      throw new PrinterError("not_connected", "Printer is not connected.");
    }

    try {
      const response = await fetch(`${this.bridgeUrl}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: toArrayBuffer(bytes),
      });

      if (!response.ok) {
        throw new Error(`Bridge print failed (${response.status}).`);
      }
    } catch (error) {
      if (error instanceof PrinterError) throw error;
      throw new PrinterError(
        "print_failed",
        "The print bridge could not send the label to the printer.",
      );
    }
  }
}
