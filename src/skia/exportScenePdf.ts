import type { Container } from 'pixi.js-legacy';
import { DefaultPixiSkiaAdapter } from '../adapters/pixiSkiaAdapter';
import type { FillStyle, Matrix2D, Point, StrokeStyle } from '../types/skia';

export type PdfSceneCommand =
  | {
      kind: 'ellipse';
      transform: Matrix2D;
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill?: FillStyle;
      stroke?: StrokeStyle;
    }
  | {
      kind: 'rect';
      transform: Matrix2D;
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: FillStyle;
      stroke?: StrokeStyle;
    }
  | {
      kind: 'polyline';
      transform: Matrix2D;
      points: Point[];
      stroke: StrokeStyle;
    }
  | {
      kind: 'sprite';
      transform: Matrix2D;
      width: number;
      height: number;
      anchorX: number;
      anchorY: number;
    };

export type PdfScenePayload = {
  width: number;
  height: number;
  commands: PdfSceneCommand[];
};

export async function exportCurrentSceneToPdf(container: Container, width: number, height: number): Promise<void> {
  const payload = serializeContainerForPdf(container, width, height);
  const response = await fetch('/api/export-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'PDF export failed.');
  }

  const blob = await response.blob();
  downloadBlob(blob, `sboard-scene-${Date.now()}.pdf`);
}

export function serializeContainerForPdf(container: Container, width: number, height: number): PdfScenePayload {
  const adapter = new DefaultPixiSkiaAdapter();
  const commands = adapter.collect(container).map((command): PdfSceneCommand => {
    if (command.kind === 'sprite') {
      return {
        kind: 'sprite',
        transform: command.transform,
        width: command.sprite.texture.width,
        height: command.sprite.texture.height,
        anchorX: command.sprite.anchor?.x ?? 0,
        anchorY: command.sprite.anchor?.y ?? 0,
      };
    }

    if (command.kind === 'ellipse') {
      return {
        kind: 'ellipse',
        transform: command.transform,
        cx: command.cx,
        cy: command.cy,
        rx: command.rx,
        ry: command.ry,
        fill: command.fill,
        stroke: command.stroke,
      };
    }

    if (command.kind === 'rect') {
      return {
        kind: 'rect',
        transform: command.transform,
        x: command.x,
        y: command.y,
        width: command.width,
        height: command.height,
        fill: command.fill,
        stroke: command.stroke,
      };
    }

    return {
      kind: 'polyline',
      transform: command.transform,
      points: command.points,
      stroke: command.stroke,
    };
  });

  return { width, height, commands };
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
