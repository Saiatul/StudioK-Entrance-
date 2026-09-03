import {
  COMPANY_NAME,
  LABEL_HEIGHT_PX,
  LABEL_WIDTH_PX,
  type RasterLabel,
} from "@/lib/printer/types";
import { packMonoBitmap } from "@/lib/printer/raster";

export type LabelContent = {
  name: string;
  subtitle?: string;
};

function fitName(
  ctx: CanvasRenderingContext2D,
  name: string,
  maxWidth: number,
  maxHeight: number,
): { fontSize: number; lines: string[] } {
  const minFont = 18;
  const maxFont = Math.min(64, maxHeight);
  let best = minFont;

  const trySize = (fontSize: number, lines: string[]) => {
    ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const height = lines.length * fontSize * 1.05;
    return widest <= maxWidth && height <= maxHeight;
  };

  for (let size = maxFont; size >= minFont; size -= 1) {
    if (trySize(size, [name])) {
      best = size;
      return { fontSize: best, lines: [name] };
    }
  }

  const words = name.split(/\s+/);
  if (words.length > 1) {
    for (let split = 1; split < words.length; split += 1) {
      const lines = [words.slice(0, split).join(" "), words.slice(split).join(" ")];
      for (let size = maxFont; size >= minFont; size -= 1) {
        if (trySize(size, lines)) {
          return { fontSize: size, lines };
        }
      }
    }
  }

  ctx.font = `700 ${minFont}px Arial, Helvetica, sans-serif`;
  return { fontSize: minFont, lines: wrapLine(ctx, name, maxWidth) };
}

function wrapLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function drawMonogram(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(2, size * 0.08);

  const radius = 4;
  roundRect(ctx, x, y, size, size, radius);
  ctx.stroke();

  ctx.font = `800 ${Math.round(size * 0.42)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SK", x + size / 2, y + size / 2 + 1);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderLabelRaster(
  content: LabelContent,
): Promise<RasterLabel> {
  const width = LABEL_WIDTH_PX;
  const height = LABEL_HEIGHT_PX;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to create label canvas.");
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000000";
  ctx.imageSmoothingEnabled = false;

  const brandWidth = 108;
  const nameAreaWidth = width - brandWidth - 16;
  const name = content.name.trim().toUpperCase() || "GUEST";
  const fitted = fitName(ctx, name, nameAreaWidth, height - 28);

  ctx.font = `700 ${fitted.fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lineHeight = fitted.fontSize * 1.05;
  const blockHeight = fitted.lines.length * lineHeight;
  const startY = Math.round(height * 0.42 - blockHeight / 2);

  fitted.lines.forEach((line, index) => {
    ctx.fillText(line, 8 + nameAreaWidth / 2, startY + index * lineHeight + lineHeight / 2);
  });

  if (content.subtitle) {
    ctx.font = "600 16px Arial, Helvetica, sans-serif";
    ctx.fillText(content.subtitle.toUpperCase(), 8 + nameAreaWidth / 2, startY + blockHeight + 18);
  }

  const logoSize = 42;
  const logoX = width - brandWidth + 8;
  const logoY = height - logoSize - 28;
  drawMonogram(ctx, logoX, logoY, logoSize);

  ctx.font = "800 13px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(COMPANY_NAME, logoX, logoY + logoSize + 6);

  const image = ctx.getImageData(0, 0, width, height);
  const packed = packMonoBitmap(image.data, width, height);

  return {
    widthPx: width,
    heightPx: height,
    bytesPerRow: packed.bytesPerRow,
    bytes: packed.bytes,
  };
}

export function renderTestLabelRaster(): Promise<RasterLabel> {
  return renderLabelRaster({
    name: "TEST PRINT",
    subtitle: "SEZNIK LD0801  50mm x 25mm",
  });
}
