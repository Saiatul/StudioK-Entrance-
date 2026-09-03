import {
  LABEL_HEIGHT_PX,
  LABEL_WIDTH_PX,
  type RasterLabel,
} from "@/lib/printer/types";
import { packMonoBitmap } from "@/lib/printer/raster";

export type LabelContent = {
  name: string;
  role?: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load studioK mark."));
    image.src = src;
  });
}

function fitName(
  ctx: CanvasRenderingContext2D,
  name: string,
  maxWidth: number,
  maxHeight: number,
): { fontSize: number; lines: string[] } {
  const minFont = 16;
  const maxFont = Math.min(42, maxHeight);
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
  return lines.slice(0, 2);
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

  const columnSplit = Math.round(width * 0.46);
  const mark = await loadImage("/branding/studiok-mark.png");
  const markWidth = columnSplit - 12;
  const markHeight = Math.round(markWidth * (mark.height / mark.width));
  ctx.drawImage(
    mark,
    6,
    Math.round((height - markHeight) / 2),
    markWidth,
    markHeight,
  );

  const textX = columnSplit + 6;
  const textWidth = width - textX - 8;
  const name = content.name.trim().toUpperCase() || "GUEST";
  const role = (content.role || "").trim().toUpperCase();
  const nameHeight = role ? Math.round(height * 0.58) : height - 16;
  const fitted = fitName(ctx, name, textWidth, nameHeight);

  ctx.font = `700 ${fitted.fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const lineHeight = fitted.fontSize * 1.08;
  fitted.lines.forEach((line, index) => {
    ctx.fillText(line, textX, 10 + index * lineHeight);
  });

  if (role) {
    ctx.font = "600 18px Arial, Helvetica, sans-serif";
    ctx.textBaseline = "bottom";
    ctx.fillText(role, textX, height - 10);
  }

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
    role: "Founder",
  });
}
