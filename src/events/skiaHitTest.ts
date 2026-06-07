import type { DisplayObject } from 'pixi.js-legacy';
import { DefaultPixiSkiaAdapter } from '../adapters/pixiSkiaAdapter';
import type { Point, VectorCommand } from '../types/skia';
import { applyMatrix, invertMatrix } from '../utils/matrix';

const adapter = new DefaultPixiSkiaAdapter();

export function bindSkiaPointerEvents(canvas: HTMLCanvasElement, root: DisplayObject): () => void {
  const onPointerDown = (event: PointerEvent) => emitHit(canvas, root, event, 'pointerdown');
  const onPointerUp = (event: PointerEvent) => emitHit(canvas, root, event, 'pointerup');

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointerup', onPointerUp);
  };
}

function emitHit(canvas: HTMLCanvasElement, root: DisplayObject, event: PointerEvent, type: 'pointerdown' | 'pointerup'): void {
  const command = findTopCommand(root, getCanvasPoint(canvas, event));
  if (!command) return;
  (command.source as any).emit(type, event);
}

function findTopCommand(root: DisplayObject, point: Point): VectorCommand | undefined {
  const commands = adapter.collect(root as any);
  return commands.reverse().find((command) => commandContainsPoint(command, point));
}

function commandContainsPoint(command: VectorCommand, worldPoint: Point): boolean {
  const inverse = invertMatrix(command.transform);
  if (!inverse) return false;

  const point = applyMatrix(inverse, worldPoint);
  if (command.kind === 'rect') {
    return point.x >= command.x && point.x <= command.x + command.width && point.y >= command.y && point.y <= command.y + command.height;
  }

  if (command.kind === 'ellipse') {
    const dx = (point.x - command.cx) / command.rx;
    const dy = (point.y - command.cy) / command.ry;
    return dx * dx + dy * dy <= 1;
  }

  if (command.kind === 'polyline') {
    return distanceToPolyline(point, command.points) <= command.stroke.width / 2 + 4;
  }

  const width = command.sprite.texture.width;
  const height = command.sprite.texture.height;
  const anchorX = command.sprite.anchor?.x ?? 0;
  const anchorY = command.sprite.anchor?.y ?? 0;
  return point.x >= -anchorX * width && point.x <= (1 - anchorX) * width && point.y >= -anchorY * height && point.y <= (1 - anchorY) * height;
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function distanceToPolyline(point: Point, points: Point[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let index = 1; index < points.length; index += 1) {
    min = Math.min(min, distanceToSegment(point, points[index - 1], points[index]));
  }
  return min;
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(point.x - a.x, point.y - a.y);

  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}
