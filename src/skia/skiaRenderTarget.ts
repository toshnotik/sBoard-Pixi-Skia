import type { Sprite } from 'pixi.js-legacy';
import type { CanvasKit } from './canvasKit';
import type { FillStyle, Matrix2D, Point, SkiaRenderTarget, StrokeStyle } from '../types/skia';
import { parseHexColor } from '../utils/color';

const imageCache = new WeakMap<object, any>();

export class CanvasKitRenderTarget implements SkiaRenderTarget {
  public constructor(
    private readonly ck: CanvasKit,
    private readonly canvas: any,
  ) {}

  public save(): void {
    this.canvas.save();
  }

  public restore(): void {
    this.canvas.restore();
  }

  public concat(matrix: Matrix2D): void {
    this.canvas.concat([matrix.a, matrix.c, matrix.tx, matrix.b, matrix.d, matrix.ty, 0, 0, 1]);
  }

  public drawEllipse(cx: number, cy: number, rx: number, ry: number, fill?: FillStyle, stroke?: StrokeStyle): void {
    const rect = this.ck.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2);
    this.withPaint(fill, this.ck.PaintStyle.Fill, (paint) => this.canvas.drawOval(rect, paint));
    this.withPaint(stroke, this.ck.PaintStyle.Stroke, (paint) => this.canvas.drawOval(rect, paint));
  }

  public drawRect(x: number, y: number, width: number, height: number, fill?: FillStyle, stroke?: StrokeStyle): void {
    const rect = this.ck.XYWHRect(x, y, width, height);
    this.withPaint(fill, this.ck.PaintStyle.Fill, (paint) => this.canvas.drawRect(rect, paint));
    this.withPaint(stroke, this.ck.PaintStyle.Stroke, (paint) => this.canvas.drawRect(rect, paint));
  }

  public drawPolyline(points: Point[], stroke: StrokeStyle): void {
    if (points.length < 2) return;

    const path = new this.ck.Path();
    path.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) {
      path.lineTo(point.x, point.y);
    }

    this.withPaint(stroke, this.ck.PaintStyle.Stroke, (paint) => this.canvas.drawPath(path, paint));
    path.delete();
  }

  public async drawSprite(sprite: Sprite): Promise<void> {
    const image = await this.getSkiaImage(sprite);
    if (!image) return;

    const width = sprite.texture.width;
    const height = sprite.texture.height;
    const anchorX = sprite.anchor?.x ?? 0;
    const anchorY = sprite.anchor?.y ?? 0;
    const rect = this.ck.XYWHRect(-anchorX * width, -anchorY * height, width, height);
    this.canvas.drawImageRect(image, rect, rect, null);
  }

  private withPaint(
    style: FillStyle | StrokeStyle | undefined,
    paintStyle: number,
    draw: (paint: any) => void,
  ): void {
    if (!style) return;

    const paint = new this.ck.Paint();
    const [r, g, b, a] = parseHexColor(style.color, style.alpha);
    paint.setColor(this.ck.Color(r, g, b, a));
    paint.setStyle(paintStyle);

    if ('width' in style) {
      paint.setStrokeWidth(style.width);
      paint.setStrokeCap(this.ck.StrokeCap.Round);
    }

    draw(paint);
    paint.delete();
  }

  private async getSkiaImage(sprite: Sprite): Promise<any | null> {
    const source = getTextureSource(sprite);
    if (!source) return null;

    if (imageCache.has(source)) return imageCache.get(source);

    const bitmap = await createImageBitmap(source as ImageBitmapSource);
    const image = this.ck.MakeImageFromCanvasImageSource(bitmap);
    imageCache.set(source, image);
    return image;
  }
}

function getTextureSource(sprite: Sprite): object | null {
  const texture = sprite.texture as any;
  const resource = texture.baseTexture?.resource;
  return resource?.source ?? texture.source?.resource ?? null;
}
