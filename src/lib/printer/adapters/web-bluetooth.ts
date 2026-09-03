import {
  DEFAULT_BLE_CHUNK_DELAY_MS,
  DEFAULT_BLE_CHUNK_SIZE,
  PrinterError,
  type PrinterAdapter,
  type PrinterConnectionState,
} from "@/lib/printer/types";

const OPTIONAL_SERVICES = [
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "000018f0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export class WebBluetoothPrinterAdapter implements PrinterAdapter {
  readonly id = "web-bluetooth" as const;
  readonly label = "Web Bluetooth";

  private state: PrinterConnectionState = "disconnected";
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private deviceName: string | null = null;

  getState(): PrinterConnectionState {
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      return "unsupported";
    }
    return this.state;
  }

  getDeviceName(): string | null {
    return this.deviceName;
  }

  async connect(): Promise<void> {
    if (typeof window === "undefined" || !window.isSecureContext) {
      throw new PrinterError(
        "insecure_context",
        "Bluetooth printing requires HTTPS or localhost.",
      );
    }

    if (!navigator.bluetooth) {
      this.state = "unsupported";
      throw new PrinterError(
        "bluetooth_unsupported",
        "Web Bluetooth is not available in this browser.",
      );
    }

    this.state = "connecting";

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: OPTIONAL_SERVICES,
      });

      device.addEventListener("gattserverdisconnected", () => {
        this.state = "disconnected";
        this.characteristic = null;
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new PrinterError(
          "printer_unavailable",
          "Unable to open a Bluetooth GATT connection.",
        );
      }

      const characteristic = await this.findWritableCharacteristic(server);
      this.device = device;
      this.characteristic = characteristic;
      this.deviceName = device.name ?? "SEZNIK printer";
      this.state = "connected";
    } catch (error) {
      this.state = "disconnected";
      this.device = null;
      this.characteristic = null;
      this.deviceName = null;
      throw this.mapError(error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.device?.gatt?.disconnect();
    } catch {
      // Ignore disconnect failures.
    }

    this.state = "disconnected";
    this.device = null;
    this.characteristic = null;
    this.deviceName = null;
  }

  async printBytes(bytes: Uint8Array): Promise<void> {
    if (this.state !== "connected" || !this.characteristic) {
      throw new PrinterError("not_connected", "Printer is not connected.");
    }

    try {
      for (let offset = 0; offset < bytes.length; offset += DEFAULT_BLE_CHUNK_SIZE) {
        const chunk = bytes.slice(offset, offset + DEFAULT_BLE_CHUNK_SIZE);
        await this.writeChunk(chunk);
        await delay(DEFAULT_BLE_CHUNK_DELAY_MS);
      }
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private async writeChunk(chunk: Uint8Array): Promise<void> {
    const characteristic = this.characteristic;
    if (!characteristic) {
      throw new PrinterError("not_connected", "Printer is not connected.");
    }

    const payload = new Uint8Array(chunk);

    if (characteristic.properties.writeWithoutResponse && characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(payload);
      return;
    }

    if (characteristic.writeValueWithResponse) {
      await characteristic.writeValueWithResponse(payload);
      return;
    }

    await characteristic.writeValue(payload);
  }

  private async findWritableCharacteristic(
    server: BluetoothRemoteGATTServer,
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    const services = await server.getPrimaryServices();

    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      const writable = characteristics.find(
        (item) => item.properties.writeWithoutResponse || item.properties.write,
      );
      if (writable) return writable;
    }

    throw new PrinterError(
      "printer_unavailable",
      "No writable Bluetooth characteristic was found on this device.",
    );
  }

  private mapError(error: unknown): PrinterError {
    if (error instanceof PrinterError) return error;

    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      return new PrinterError(
        "bluetooth_permission_denied",
        "Bluetooth permission is required to print the badge.",
      );
    }

    if (name === "NotFoundError") {
      return new PrinterError("not_connected", "Printer is not connected.");
    }

    return new PrinterError(
      "print_failed",
      error instanceof Error ? error.message : "Badge printing failed.",
    );
  }
}
