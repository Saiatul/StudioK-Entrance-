"use client";

import { useSyncExternalStore } from "react";
import { getPrintService } from "@/lib/printer/print-service";
import {
  DEFAULT_PRINT_SETTINGS,
  type PrinterStatus,
} from "@/lib/printer/types";

const EMPTY_STATUS: PrinterStatus = {
  state: "disconnected",
  adapterId: DEFAULT_PRINT_SETTINGS.adapterId,
  deviceName: null,
  protocol: DEFAULT_PRINT_SETTINGS.protocol,
};

function subscribe(onStoreChange: () => void) {
  return getPrintService().subscribe(onStoreChange);
}

function getSnapshot() {
  return getPrintService().getStatus();
}

function getServerSnapshot() {
  return EMPTY_STATUS;
}

export function usePrinterStatus(): PrinterStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
