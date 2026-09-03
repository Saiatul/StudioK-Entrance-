import type { RasterLabel } from "@/lib/printer/types";

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

export function buildEscPosJob(label: RasterLabel): Uint8Array {
  const enable = new Uint8Array([0x10, 0xff, 0x40]);
  const init = new Uint8Array([0x10, 0xff, 0xf1, 0x03]);
  const density = new Uint8Array([0x10, 0xff, 0x10, 0x00, 0x03, 0x00]);
  const header = new Uint8Array([
    0x1d,
    0x76,
    0x30,
    0x00,
    label.bytesPerRow & 0xff,
    (label.bytesPerRow >> 8) & 0xff,
    label.heightPx & 0xff,
    (label.heightPx >> 8) & 0xff,
  ]);
  const feed = new Uint8Array([0x1b, 0x4a, 0x40]);
  const end = new Uint8Array([0x10, 0xff, 0xf1, 0x45]);

  return concat([enable, init, density, header, label.bytes, feed, end]);
}
