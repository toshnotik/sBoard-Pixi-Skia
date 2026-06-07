import type { Container, DisplayObject, Sprite } from 'pixi.js-legacy';

export type Point = {
  x: number;
  y: number;
};

export type Matrix2D = {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
};

export type FillStyle = {
  color: string;
  alpha: number;
};

export type StrokeStyle = {
  color: string;
  alpha: number;
  width: number;
};

export type VectorCommand =
  | {
      kind: 'ellipse';
      transform: Matrix2D;
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill?: FillStyle;
      stroke?: StrokeStyle;
      source: DisplayObject;
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
      source: DisplayObject;
    }
  | {
      kind: 'polyline';
      transform: Matrix2D;
      points: Point[];
      stroke: StrokeStyle;
      source: DisplayObject;
    }
  | {
      kind: 'sprite';
      transform: Matrix2D;
      sprite: Sprite;
      source: DisplayObject;
    };

export type SkiaRenderTarget = {
  save(): void;
  restore(): void;
  concat(matrix: Matrix2D): void;
  drawEllipse(cx: number, cy: number, rx: number, ry: number, fill?: FillStyle, stroke?: StrokeStyle): void;
  drawRect(x: number, y: number, width: number, height: number, fill?: FillStyle, stroke?: StrokeStyle): void;
  drawPolyline(points: Point[], stroke: StrokeStyle): void;
  drawSprite(sprite: Sprite): Promise<void> | void;
};

export type PixiSkiaAdapter = {
  collect(container: Container): VectorCommand[];
  render(container: Container, target: SkiaRenderTarget): Promise<void>;
};
