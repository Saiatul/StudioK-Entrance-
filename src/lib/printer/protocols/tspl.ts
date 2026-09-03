import {
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
  type RasterLabel,
} from "@/lib/printer/types";

function encoder() {
  return new TextEncoder();
}

function command(text: string): Uint8Array {
  return encoder().encode(`${text}\r\n`);
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export function buildTsplJob(
  label: RasterLabel,
  options?: { gapMm?: number; density?: number; direction?: 0 | 1 },
): Uint8Array {
  const gapMm = options?.gapMm ?? 2;
  const density = options?.density ?? 8;
  const direction = options?.direction ?? 0;
  const widthMm = Math.round((label.widthPx / 203) * 25.4) || LABEL_WIDTH_MM;
  const heightMm = Math.round((label.heightPx / 203) * 25.4) || LABEL_HEIGHT_MM;

  const header = concat([
    command(`SIZE ${widthMm} mm,${heightMm} mm`),
    command(`GAP ${gapMm} mm,0`),
    command(`DIRECTION ${direction}`),
    command(`DENSITY ${density}`),
    command("CLS"),
    encoder().encode(
      `BITMAP 0,0,${label.bytesPerRow},${label.heightPx},0,`,
    ),
  ]);

  const footer = command("\r\nPRINT 1,1");
  return concat([header, label.bytes, footer]);
}
