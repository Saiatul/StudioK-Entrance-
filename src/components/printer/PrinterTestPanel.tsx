"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getPrintService } from "@/lib/printer/print-service";
import { usePrinterStatus } from "@/lib/printer/use-printer-status";
import {
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
  const [settings, setSettings] = useState(() =>
    typeof window === "undefined"
      ? getPrintServiceFallback()
      : getPrintService().getSettings(),
  );

  useEffect(() => {
    setSettings(getPrintService().getSettings());
  }, [status]);

  async function connect() {
    setBusy("connect");
    setError("");
    setMessage("");
    try {
      await getPrintService().connect(settings.adapterId);
      setMessage("Printer connected. Print a test label before using registration.");
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
      setMessage("Test label sent. Confirm the physical 50mm × 25mm print before using the desk flow.");
    } catch (err) {
      setVerified(false);
      setError(userMessageForPrinterError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-line bg-white/[0.03] p-6">
        <p className="text-sm tracking-[0.28em] text-gold uppercase">Printer Status</p>
        <p className="font-display mt-3 text-4xl text-cream">
          {statusLabel(status.state)}
        </p>
        <p className="mt-2 text-lg text-cream/60">
          {status.deviceName || "SEZNIK Josh LD0801"}
        </p>
        <p className="mt-4 text-base leading-relaxed text-cream/55">
          This tablet talks to the label printer over Bluetooth or a local print
          bridge. Browser <code className="text-gold">window.print()</code> is
          not used. Direct Web Bluetooth has not been verified on this LD0801 yet.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm tracking-[0.18em] text-cream/70 uppercase">
          Connection
        </span>
        <select
          value={settings.adapterId}
          onChange={(event) => {
            const adapterId = event.target.value as PrinterAdapterId;
            getPrintService().updateSettings({ adapterId });
            setSettings(getPrintService().getSettings());
          }}
          className="h-16 w-full appearance-none rounded-2xl border border-line bg-white/[0.04] px-5 text-lg text-cream"
        >
          <option value="web-bluetooth">Web Bluetooth (tablet)</option>
          <option value="print-bridge">Local print bridge</option>
        </select>
      </label>

      {settings.adapterId === "print-bridge" ? (
        <label className="block">
          <span className="mb-2 block text-sm tracking-[0.18em] text-cream/70 uppercase">
            Bridge URL
          </span>
          <input
            value={settings.bridgeUrl}
            onChange={(event) => {
              getPrintService().updateSettings({ bridgeUrl: event.target.value });
              setSettings(getPrintService().getSettings());
            }}
            className="h-16 w-full rounded-2xl border border-line bg-white/[0.04] px-5 text-lg text-cream outline-none"
          />
        </label>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm tracking-[0.18em] text-cream/70 uppercase">
            Protocol
          </span>
          <select
            value={settings.protocol}
            onChange={(event) => {
              getPrintService().updateSettings({
                protocol: event.target.value as PrintProtocol,
              });
              setSettings(getPrintService().getSettings());
            }}
            className="h-16 w-full appearance-none rounded-2xl border border-line bg-white/[0.04] px-5 text-lg text-cream"
          >
            <option value="tspl">TSPL label (recommended)</option>
            <option value="escpos">ESC/POS raster fallback</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm tracking-[0.18em] text-cream/70 uppercase">
            Rotation
          </span>
          <select
            value={String(settings.rotation)}
            onChange={(event) => {
              getPrintService().updateSettings({
                rotation: Number(event.target.value) as PrintRotation,
              });
              setSettings(getPrintService().getSettings());
            }}
            className="h-16 w-full appearance-none rounded-2xl border border-line bg-white/[0.04] px-5 text-lg text-cream"
          >
            <option value="0">0° — 50mm × 25mm</option>
            <option value="180">180°</option>
            <option value="90">90° (if the printer feeds sideways)</option>
            <option value="270">270°</option>
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <Button onClick={connect} loading={busy === "connect"}>
          Connect Printer
        </Button>
        <Button
          variant="ghost"
          onClick={printTest}
          loading={busy === "print"}
          disabled={status.state !== "connected"}
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

      {message ? <p className="text-lg text-gold">{message}</p> : null}
      {error ? <p className="text-lg text-rose-300">{error}</p> : null}

      <div className="rounded-2xl border border-line bg-white/[0.03] p-5 text-base leading-relaxed text-cream/60">
        <p className="mb-2 font-semibold tracking-[0.18em] text-cream/80 uppercase">
          Hardware verification
        </p>
        <p>
          {verified
            ? "A test job was sent from this tablet. Confirm the physical label before going live."
            : "SEZNIK LD0801 Bluetooth printing is implemented, but not marked working until a test label is confirmed on the tablet."}
        </p>
      </div>
    </div>
  );
}

function getPrintServiceFallback() {
  return {
    adapterId: "web-bluetooth" as const,
    protocol: "tspl" as const,
    rotation: 0 as const,
    gapMm: 2,
    density: 8,
    bridgeUrl: "http://127.0.0.1:9100",
  };
}
