import { LpapiCompanionAdapter } from "@/lib/printer/adapters/lpapi";
import { PrintBridgeAdapter } from "@/lib/printer/adapters/print-bridge";
import { WebBluetoothPrinterAdapter } from "@/lib/printer/adapters/web-bluetooth";
import { renderLabelRaster, renderTestLabelRaster } from "@/lib/printer/label";
import { buildEscPosJob } from "@/lib/printer/protocols/escpos";
import { buildTsplJob } from "@/lib/printer/protocols/tspl";
import { rotatePackedBitmap } from "@/lib/printer/raster";
import {
  getDefaultPrintSettings,
  PRINT_SETTINGS_KEY,
  PrinterError,
  type PrintSettings,
  type PrintableGuest,
  type PrinterAdapter,
  type PrinterAdapterId,
  type PrinterStatus,
  type RasterLabel,
} from "@/lib/printer/types";

function loadSettings(): PrintSettings {
  const defaults = getDefaultPrintSettings();
  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(PRINT_SETTINGS_KEY);
    if (!raw) return defaults;
    const merged = { ...defaults, ...JSON.parse(raw) } as PrintSettings;
    // Always use the companion printer app for SEZNIK badges
    merged.adapterId = "lpapi";
    return merged;
  } catch {
    return defaults;
  }
}

function persistSettings(settings: PrintSettings) {
  window.localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(settings));
}

class PrintService {
  private settings: PrintSettings = getDefaultPrintSettings();
  private lpapi = new LpapiCompanionAdapter();
  private webBluetooth = new WebBluetoothPrinterAdapter();
  private printBridge = new PrintBridgeAdapter(getDefaultPrintSettings().bridgeUrl);
  private listeners = new Set<() => void>();
  private cachedStatus: PrinterStatus | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.settings = loadSettings();
      this.printBridge.setBridgeUrl(this.settings.bridgeUrl);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getSettings(): PrintSettings {
    return this.settings;
  }

  getStatus(): PrinterStatus {
    const adapter = this.currentAdapter();
    const next: PrinterStatus = {
      state: adapter.getState(),
      adapterId: this.settings.adapterId,
      deviceName: adapter.getDeviceName(),
      protocol: this.settings.protocol,
    };

    if (
      this.cachedStatus &&
      this.cachedStatus.state === next.state &&
      this.cachedStatus.adapterId === next.adapterId &&
      this.cachedStatus.deviceName === next.deviceName &&
      this.cachedStatus.protocol === next.protocol
    ) {
      return this.cachedStatus;
    }

    this.cachedStatus = next;
    return next;
  }

  updateSettings(partial: Partial<PrintSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.printBridge.setBridgeUrl(this.settings.bridgeUrl);
    persistSettings(this.settings);
    this.notify();
  }

  private currentAdapter(): PrinterAdapter {
    if (this.settings.adapterId === "print-bridge") return this.printBridge;
    if (this.settings.adapterId === "lpapi") return this.lpapi;
    return this.webBluetooth;
  }

  async connect(adapterId?: PrinterAdapterId): Promise<void> {
    if (adapterId && adapterId !== this.settings.adapterId) {
      await this.disconnect();
      this.updateSettings({ adapterId });
    }

    await this.currentAdapter().connect();
    this.notify();
  }

  async disconnect(): Promise<void> {
    await this.currentAdapter().disconnect();
    this.notify();
  }

  async printRaster(label: RasterLabel): Promise<void> {
    if (this.settings.adapterId === "lpapi") {
      throw new PrinterError(
        "print_failed",
        "The studioK Printer app prints the badge directly.",
      );
    }

    const adapter = this.currentAdapter();
    if (adapter.getState() !== "connected") {
      throw new PrinterError("not_connected", "Printer is not connected.");
    }

    const rotated = rotatePackedBitmap(
      label.bytes,
      label.widthPx,
      label.heightPx,
      label.bytesPerRow,
      this.settings.rotation,
    );

    const payload: RasterLabel = {
      widthPx: rotated.width,
      heightPx: rotated.height,
      bytesPerRow: rotated.bytesPerRow,
      bytes: rotated.bytes,
    };

    const job =
      this.settings.protocol === "escpos"
        ? buildEscPosJob(payload)
        : buildTsplJob(payload, {
            gapMm: this.settings.gapMm,
            density: this.settings.density,
            direction: 0,
          });

    await adapter.printBytes(job);
  }

  async printTestLabel(): Promise<void> {
    // Always use the companion queue (SEZNIK prints via studioK Printer app)
    await this.lpapi.printTest();
    this.updateSettings({ adapterId: "lpapi" });
    this.notify();
  }

  async printGuestBadge(guest: PrintableGuest): Promise<void> {
    // Always use the companion queue — do not depend on adapter dropdown
    await this.lpapi.printGuest(guest.name, guest.role);
    this.updateSettings({ adapterId: "lpapi" });
    this.notify();
  }
}

let instance: PrintService | null = null;

export function getPrintService(): PrintService {
  if (typeof window === "undefined") {
    throw new Error("Print service is browser-only.");
  }
  if (!instance) {
    instance = new PrintService();
  }
  return instance;
}
