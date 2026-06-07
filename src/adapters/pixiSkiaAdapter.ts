import * as PIXI from 'pixi.js-legacy';
import type { PixiSkiaAdapter, SkiaRenderTarget, VectorCommand } from '../types/skia';
import { getGraphicsCommands, toVectorCommand } from './pixiCommandGraphics';

export class DefaultPixiSkiaAdapter implements PixiSkiaAdapter {
  public collect(container: PIXI.Container): VectorCommand[] {
    container.updateTransform();
    const commands: VectorCommand[] = [];
    this.walk(container, commands);
    return commands;
  }

  public async render(container: PIXI.Container, target: SkiaRenderTarget): Promise<void> {
    const commands = this.collect(container);

    for (const command of commands) {
      target.save();
      target.concat(command.transform);

      if (command.kind === 'ellipse') {
        target.drawEllipse(command.cx, command.cy, command.rx, command.ry, command.fill, command.stroke);
      } else if (command.kind === 'rect') {
        target.drawRect(command.x, command.y, command.width, command.height, command.fill, command.stroke);
      } else if (command.kind === 'polyline') {
        target.drawPolyline(command.points, command.stroke);
      } else {
        await target.drawSprite(command.sprite);
      }

      target.restore();
    }
  }

  private walk(displayObject: PIXI.DisplayObject, commands: VectorCommand[]): void {
    if (!displayObject.visible || displayObject.worldAlpha <= 0) return;

    if (displayObject instanceof PIXI.Sprite) {
      commands.push({
        kind: 'sprite',
        transform: {
          a: displayObject.worldTransform.a,
          b: displayObject.worldTransform.b,
          c: displayObject.worldTransform.c,
          d: displayObject.worldTransform.d,
          tx: displayObject.worldTransform.tx,
          ty: displayObject.worldTransform.ty,
        },
        sprite: displayObject,
        source: displayObject,
      });
      return;
    }

    if (displayObject instanceof PIXI.Graphics) {
      for (const command of getGraphicsCommands(displayObject)) {
        commands.push(toVectorCommand(command, displayObject));
      }
    }

    if (displayObject instanceof PIXI.Container) {
      for (const child of displayObject.children) {
        this.walk(child, commands);
      }
    }
  }
}
