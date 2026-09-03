export const LABEL_WIDTH_MM = 50;
export const LABEL_HEIGHT_MM = 25;
export const PRINTER_DPI = 203;

export const LABEL_WIDTH_PX = Math.round((LABEL_WIDTH_MM / 25.4) * PRINTER_DPI);
export const LABEL_HEIGHT_PX = Math.round((LABEL_HEIGHT_MM / 25.4) * PRINTER_DPI);

export const DEFAULT_GAP_MM = 2;
export const DEFAULT_DENSITY = 8;
export const DEFAULT_BLE_CHUNK_SIZE = 180;
export const DEFAULT_BLE_CHUNK_DELAY_MS = 40;

export const COMPANY_NAME = "STUDIOK";

export const PRINT_SETTINGS_KEY = "studiok.print.settings";

export type PrintProtocol = "tspl" | "escpos";
export type PrintRotation = 0 | 90 | 180 | 270;
export type PrinterAdapterId = "web-bluetooth" | "print-bridge";

export type PrinterConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "unsupported";

export type PrinterErrorCode =
  | "not_connected"
  | "bluetooth_unsupported"
  | "bluetooth_permission_denied"
  | "printer_unavailable"
  | "print_failed"
  | "bridge_unavailable"
  | "insecure_context";

export class PrinterError extends Error {
  readonly code: PrinterErrorCode;

  constructor(code: PrinterErrorCode, message: string) {
    super(message);
    this.name = "PrinterError";
    this.code = code;
  }
}

export type RasterLabel = {
  widthPx: number;
  heightPx: number;
  bytesPerRow: number;
  bytes: Uint8Array;
};

export type PrintableGuest = {
  id: number;
  name: string;
};

export type PrinterStatus = {
  state: PrinterConnectionState;
  adapterId: PrinterAdapterId;
  deviceName: string | null;
  protocol: PrintProtocol;
};

export type PrintSettings = {
  adapterId: PrinterAdapterId;
  protocol: PrintProtocol;
  rotation: PrintRotation;
  gapMm: number;
  density: number;
  bridgeUrl: string;
};

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  adapterId: "web-bluetooth",
  protocol: "tspl",
  rotation: 0,
  gapMm: DEFAULT_GAP_MM,
  density: DEFAULT_DENSITY,
  bridgeUrl: "http://127.0.0.1:9100",
};

export interface PrinterAdapter {
  readonly id: PrinterAdapterId;
  readonly label: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getState(): PrinterConnectionState;
  getDeviceName(): string | null;
  printBytes(bytes: Uint8Array): Promise<void>;
}

export function userMessageForPrinterError(error: unknown): string {
  if (error instanceof PrinterError) {
    switch (error.code) {
      case "not_connected":
        return "Printer is not connected.";
      case "bluetooth_unsupported":
        return "This browser cannot talk to the printer over Bluetooth. Use Chrome on the tablet, or a print bridge.";
      case "bluetooth_permission_denied":
        return "Bluetooth permission is required to print the badge.";
      case "printer_unavailable":
        return "Badge printing failed.";
      case "bridge_unavailable":
        return "The local print bridge is not available.";
      case "insecure_context":
        return "Bluetooth printing requires HTTPS or localhost.";
      case "print_failed":
      default:
        return "Badge printing failed.";
    }
  }

  return "Badge printing failed.";
}
