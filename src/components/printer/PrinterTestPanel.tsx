"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getPrintService } from "@/lib/printer/print-service";
import { usePrinterStatus } from "@/lib/printer/use-printer-status";
import {
  getDefaultPrintSettings,
  userMessageForPrinterError,
  type PrintProtocol,
  type PrintRotation,
  type PrinterAdapterId,
} from "@/lib/printer/types";

function statusLabel(state: string) {
  if (state === "connected") return "Connected";
  if (state === "connecting") return "Connecting";
  if (state === "unsupported") return "Unsupported";
  return "Disconnected";
}

export function PrinterTestPanel() {
  const status = usePrinterStatus();
  const [busy, setBusy] = useState<"connect" | "print" | "disconnect" | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [settings, setSettings] = useState(getDefaultPrintSettings);

  const nativeApp = settings.adapterId === "lpapi";
  const canPrint = nativeApp || status.state === "connected";

  useEffect(() => {
    setSettings(getPrintService().getSettings());
  }, [status]);

  async function connect() {
    setBusy("connect");
    setError("");
    setMessage("");
    try {
      await getPrintService().connect(settings.adapterId);
      setMessage(
        nativeApp
          ? "Opened the studioK Printer app. Connect the SEZNIK there, then print a test badge."
          : "Printer connected. Print a test label before using registration.",
      );
    } catch (err) {
      setError(userMessageForPrinterError(err));
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    setError("");
    try {
      await getPrintService().disconnect();
      setVerified(false);
      setMessage("Printer disconnected.");
    } catch (err) {
      setError(userMessageForPrinterError(err));
    } finally {
      setBusy(null);
    }
  }

  async function printTest() {
    setBusy("print");
    setError("");
    setMessage("");
    try {
      await getPrintService().printTestLabel();
      setVerified(true);
      setMessage(
        nativeApp
          ? "Sent a 50mm × 25mm test badge to the studioK Printer app. Confirm it comes out of the SEZNIK."
          : "Test label sent. Confirm the physical 50mm × 25mm print before using the desk flow.",
      );
    } catch (err) {
      setVerified(false);
      setError(userMessageForPrinterError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] bg-black/40 p-6">
        <p className="text-[13px] font-medium text-gold">Printer</p>
        <p className="mt-2 text-[34px] leading-tight font-semibold tracking-tight text-cream">
          {statusLabel(status.state)}
        </p>
        <p className="mt-2 text-[17px] text-cream/55">
          {status.deviceName || "SEZNIK Josh LD0801"}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-cream/45">
          {nativeApp
            ? "This tablet prints through the studioK Printer app, which uses the vendor Bluetooth SDK. Keep that app installed, then check in guests in Chrome."
            : "Chrome Web Bluetooth cannot talk to this printer. On the Android tablet, use the studioK Printer app."}
        </p>
      </div>

      <label className="block">
        <span className="field-label">Connection</span>
        <select
          value={settings.adapterId}
          onChange={(event) => {
            const adapterId = event.target.value as PrinterAdapterId;
            getPrintService().updateSettings({ adapterId });
            setSettings(getPrintService().getSettings());
          }}
          className="field-control w-full appearance-none"
        >
          <option value="lpapi">studioK Printer app (Android)</option>
          <option value="web-bluetooth">Web Bluetooth</option>
          <option value="print-bridge">Local print bridge</option>
        </select>
      </label>

      {settings.adapterId === "print-bridge" ? (
        <label className="block">
          <span className="field-label">Bridge URL</span>
          <input
            value={settings.bridgeUrl}
            onChange={(event) => {
              getPrintService().updateSettings({ bridgeUrl: event.target.value });
              setSettings(getPrintService().getSettings());
            }}
            className="field-control w-full"
          />
        </label>
      ) : null}

      {!nativeApp ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Protocol</span>
            <select
              value={settings.protocol}
              onChange={(event) => {
                getPrintService().updateSettings({
                  protocol: event.target.value as PrintProtocol,
                });
                setSettings(getPrintService().getSettings());
              }}
              className="field-control w-full appearance-none"
            >
              <option value="tspl">TSPL label (recommended)</option>
              <option value="escpos">ESC/POS raster fallback</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Rotation</span>
            <select
              value={String(settings.rotation)}
              onChange={(event) => {
                getPrintService().updateSettings({
                  rotation: Number(event.target.value) as PrintRotation,
                });
                setSettings(getPrintService().getSettings());
              }}
              className="field-control w-full appearance-none"
            >
              <option value="0">0° — 50mm × 25mm</option>
              <option value="180">180°</option>
              <option value="90">90° (if the printer feeds sideways)</option>
              <option value="270">270°</option>
            </select>
          </label>
        </div>
      ) : null}

      <div className="space-y-3">
        <Button onClick={connect} loading={busy === "connect"}>
          {nativeApp ? "Open Printer App" : "Connect Printer"}
        </Button>
        <Button
          variant="ghost"
          onClick={printTest}
          loading={busy === "print"}
          disabled={!canPrint}
        >
          Print Test Label
        </Button>
        <Button
          variant="ghost"
          onClick={disconnect}
          loading={busy === "disconnect"}
          disabled={status.state !== "connected"}
        >
          Disconnect
        </Button>
      </div>

      {message ? <p className="text-[15px] text-gold">{message}</p> : null}
      {error ? <p className="text-[15px] text-rose-300">{error}</p> : null}

      <div className="rounded-[18px] bg-black/40 p-5 text-[15px] leading-relaxed text-cream/50">
        <p className="mb-2 font-medium text-cream/80">Hardware</p>
        <p>
          {verified
            ? "A test job was sent from this tablet. Confirm the physical label before going live."
            : "Install studioK Printer on the tablet, connect the SEZNIK in that app, then print a 50mm × 25mm test badge from this page."}
        </p>
      </div>
    </div>
  );
}
