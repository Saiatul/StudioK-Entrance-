export function packMonoBitmap(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): { bytes: Uint8Array; bytesPerRow: number } {
  const bytesPerRow = Math.ceil(width / 8);
  const bytes = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const luminance =
        pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
      const isBlack = luminance < 160;

      if (isBlack) {
        const byteIndex = y * bytesPerRow + (x >> 3);
        bytes[byteIndex] |= 0x80 >> (x & 7);
      }
    }
  }

  return { bytes, bytesPerRow };
}

export function rotatePackedBitmap(
  bytes: Uint8Array,
  width: number,
  height: number,
  bytesPerRow: number,
  rotation: 0 | 90 | 180 | 270,
): { bytes: Uint8Array; width: number; height: number; bytesPerRow: number } {
  if (rotation === 0) {
    return { bytes, width, height, bytesPerRow };
  }

  const source = unpackToBool(bytes, width, height, bytesPerRow);
  const swapped = rotation === 90 || rotation === 270;
  const outW = swapped ? height : width;
  const outH = swapped ? width : height;
  const out = new Array<boolean>(outW * outH).fill(false);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const on = source[y * width + x];
      if (!on) continue;

      let nx = x;
      let ny = y;
      if (rotation === 90) {
        nx = height - 1 - y;
        ny = x;
      } else if (rotation === 180) {
        nx = width - 1 - x;
        ny = height - 1 - y;
      } else if (rotation === 270) {
        nx = y;
        ny = width - 1 - x;
      }

      out[ny * outW + nx] = true;
    }
  }

  const packed = packBools(out, outW, outH);
  return {
    bytes: packed.bytes,
    width: outW,
    height: outH,
    bytesPerRow: packed.bytesPerRow,
  };
}

function unpackToBool(
  bytes: Uint8Array,
  width: number,
  height: number,
  bytesPerRow: number,
): boolean[] {
  const pixels = new Array<boolean>(width * height).fill(false);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const byte = bytes[y * bytesPerRow + (x >> 3)];
      const on = ((byte >> (7 - (x & 7))) & 1) === 1;
      pixels[y * width + x] = on;
    }
  }

  return pixels;
}

function packBools(
  pixels: boolean[],
  width: number,
  height: number,
): { bytes: Uint8Array; bytesPerRow: number } {
  const bytesPerRow = Math.ceil(width / 8);
  const bytes = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!pixels[y * width + x]) continue;
      const byteIndex = y * bytesPerRow + (x >> 3);
      bytes[byteIndex] |= 0x80 >> (x & 7);
    }
  }

  return { bytes, bytesPerRow };
}
