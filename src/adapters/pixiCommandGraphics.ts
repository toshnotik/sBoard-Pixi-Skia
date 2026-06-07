import * as PIXI from 'pixi.js-legacy';
import type { FillStyle, StrokeStyle, VectorCommand } from '../types/skia';

type GraphicsCommand =
  | { type: 'rect'; x: number; y: number; width: number; height: number; fill?: FillStyle; stroke?: StrokeStyle }
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill?: FillStyle; stroke?: StrokeStyle }
  | { type: 'polyline'; points: { x: number; y: number }[]; stroke: StrokeStyle };

const COMMANDS = Symbol('skiaCommands');

type InstrumentedGraphics = PIXI.Graphics & {
  [COMMANDS]?: GraphicsCommand[];
};

export class CommandGraphics extends PIXI.Graphics {
  private readonly commands: GraphicsCommand[] = [];
  private currentFill?: FillStyle;
  private currentStroke?: StrokeStyle;
  private currentPoint?: { x: number; y: number };

  public beginFill(color: PIXI.ColorSource = 0, alpha = 1): this {
    super.beginFill(color, alpha);
    this.currentFill = { color: normalizeColor(color), alpha };
    return this;
  }

  public endFill(): this {
    super.endFill();
    this.currentFill = undefined;
    return this;
  }

  public lineStyle(width: number, color?: PIXI.ColorSource, alpha?: number, alignment?: number, native?: boolean): this;
  public lineStyle(options?: PIXI.ILineStyleOptions): this;
  public lineStyle(
    widthOrOptions?: number | PIXI.ILineStyleOptions,
    color?: PIXI.ColorSource,
    alpha = 1,
    alignment?: number,
    native?: boolean,
  ): this {
    if (typeof widthOrOptions === 'object') {
      super.lineStyle(widthOrOptions);
      const width = widthOrOptions.width ?? 0;
      this.currentStroke = width > 0 ? { width, color: normalizeColor(widthOrOptions.color ?? 0), alpha: widthOrOptions.alpha ?? 1 } : undefined;
      return this;
    }

    super.lineStyle(widthOrOptions ?? 0, color, alpha, alignment, native);
    this.currentStroke = widthOrOptions && widthOrOptions > 0 ? { width: widthOrOptions, color: normalizeColor(color ?? 0), alpha } : undefined;
    return this;
  }

  public drawRect(x: number, y: number, width: number, height: number): this {
    super.drawRect(x, y, width, height);
    this.commands.push({ type: 'rect', x, y, width, height, fill: this.currentFill, stroke: this.currentStroke });
    return this;
  }

  public drawEllipse(x: number, y: number, width: number, height: number): this {
    super.drawEllipse(x, y, width, height);
    this.commands.push({ type: 'ellipse', cx: x, cy: y, rx: width, ry: height, fill: this.currentFill, stroke: this.currentStroke });
    return this;
  }

  public moveTo(x: number, y: number): this {
    super.moveTo(x, y);
    this.currentPoint = { x, y };
    return this;
  }

  public lineTo(x: number, y: number): this {
    super.lineTo(x, y);
    if (this.currentStroke && this.currentPoint) {
      this.commands.push({ type: 'polyline', points: [this.currentPoint, { x, y }], stroke: this.currentStroke });
    }
    this.currentPoint = { x, y };
    return this;
  }

  public getSkiaCommands(): GraphicsCommand[] {
    return this.commands;
  }
}

export function isCommandGraphics(graphics: PIXI.Graphics): graphics is CommandGraphics {
  return typeof (graphics as CommandGraphics).getSkiaCommands === 'function';
}

export function getGraphicsCommands(graphics: PIXI.Graphics): GraphicsCommand[] {
  if (isCommandGraphics(graphics)) {
    return graphics.getSkiaCommands();
  }

  const instrumented = graphics as InstrumentedGraphics;
  return instrumented[COMMANDS] ?? [];
}

export function toVectorCommand(command: GraphicsCommand, graphics: PIXI.Graphics): VectorCommand {
  const transform = {
    a: graphics.worldTransform.a,
    b: graphics.worldTransform.b,
    c: graphics.worldTransform.c,
    d: graphics.worldTransform.d,
    tx: graphics.worldTransform.tx,
    ty: graphics.worldTransform.ty,
  };

  if (command.type === 'rect') {
    return { kind: 'rect', transform, x: command.x, y: command.y, width: command.width, height: command.height, fill: command.fill, stroke: command.stroke, source: graphics };
  }

  if (command.type === 'ellipse') {
    return { kind: 'ellipse', transform, cx: command.cx, cy: command.cy, rx: command.rx, ry: command.ry, fill: command.fill, stroke: command.stroke, source: graphics };
  }

  return { kind: 'polyline', transform, points: command.points, stroke: command.stroke, source: graphics };
}

function normalizeColor(color: PIXI.ColorSource): string {
  if (typeof color === 'string') return color.startsWith('#') ? color : `#${color}`;
  if (typeof color === 'number') return `#${color.toString(16).padStart(6, '0')}`;
  return `#${new PIXI.Color(color).toNumber().toString(16).padStart(6, '0')}`;
}
