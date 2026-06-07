import type { Container } from 'pixi.js-legacy';
import { DefaultPixiSkiaAdapter } from '../adapters/pixiSkiaAdapter';
import { loadCanvasKit, type CanvasKit } from './canvasKit';
import { CanvasKitRenderTarget } from './skiaRenderTarget';

export class SkiaCanvasView {
  private ck?: CanvasKit;
  private surface?: any;
  private readonly adapter = new DefaultPixiSkiaAdapter();

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly width: number,
    private readonly height: number,
  ) {}

  public async init(): Promise<void> {
    this.ck = await loadCanvasKit();
    this.surface = this.ck.MakeCanvasSurface(this.canvas);
    if (!this.surface) {
      throw new Error('CanvasKit could not create a surface for the Skia canvas.');
    }
  }

  public async render(container: Container): Promise<void> {
    if (!this.ck || !this.surface) return;

    const canvas = this.surface.getCanvas();
    canvas.clear(this.ck.Color(28, 31, 38, 1));
    await this.adapter.render(container, new CanvasKitRenderTarget(this.ck, canvas));
    this.surface.flush();
  }

  public resizeForDpr(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }
}
