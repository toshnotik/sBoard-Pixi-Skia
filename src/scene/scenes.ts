import * as PIXI from 'pixi.js-legacy';
import { CommandGraphics } from '../adapters/pixiCommandGraphics';
import assignmentScene from './assignmentScene.json';
import { createDemoSpriteTexture } from './createSpriteTexture';
import type { VectorSceneNode } from './vectorSceneTypes';

export type SceneBundle = {
  container: PIXI.Container;
  label: string;
};

export function createDemoScenes(onEvent: (message: string) => void): SceneBundle[] {
  return [createAssignmentScene(onEvent), createSecondScene(onEvent)];
}

export function createAssignmentScene(onEvent: (message: string) => void): SceneBundle {
  return {
    container: createPixiNode(assignmentScene.root as VectorSceneNode, onEvent) as PIXI.Container,
    label: 'Базовая сцена',
  };
}

export function createSecondScene(onEvent: (message: string) => void): SceneBundle {
  const container = new PIXI.Container();
  container.position.set(80, 70);

  const base = new CommandGraphics();
  base.beginFill('#16a34a').drawRect(0, 0, 230, 120).endFill();
  base.angle = -8;
  enablePointer(base, 'green panel', onEvent);

  const ellipse = new CommandGraphics();
  ellipse.beginFill('#eab308', 0.85).drawEllipse(260, 120, 85, 45).endFill();
  ellipse.scale.set(1.2, 1);
  enablePointer(ellipse, 'gold ellipse', onEvent);

  const line = new CommandGraphics();
  line.lineStyle(12, '#f8fafc', 1).moveTo(30, 210).lineTo(370, 40);
  enablePointer(line, 'diagonal line', onEvent);

  container.addChild(base, ellipse, line);
  return { container, label: 'Вторая сцена' };
}

export function addRandomShape(container: PIXI.Container, onEvent: (message: string) => void): void {
  const graphic = new CommandGraphics();
  const color = Math.floor(Math.random() * 0xffffff);
  const isLine = Math.random() > 0.5;

  if (isLine) {
    graphic.lineStyle(6 + Math.random() * 10, color, 1).moveTo(0, 0).lineTo(80 + Math.random() * 160, -70 + Math.random() * 140);
  } else if (Math.random() > 0.5) {
    graphic.beginFill(color, 0.9).drawRect(-35, -30, 70 + Math.random() * 90, 60 + Math.random() * 80).endFill();
  } else {
    graphic.beginFill(color, 0.9).drawEllipse(0, 0, 35 + Math.random() * 65, 25 + Math.random() * 50).endFill();
  }

  graphic.position.set(90 + Math.random() * 420, 90 + Math.random() * 260);
  graphic.angle = -35 + Math.random() * 70;
  graphic.scale.set(0.65 + Math.random() * 1.1);
  enablePointer(graphic, 'random shape', onEvent);
  container.addChild(graphic);
}

function enablePointer(displayObject: PIXI.DisplayObject, label: string, onEvent: (message: string) => void): void {
  displayObject.eventMode = 'static';
  displayObject.cursor = 'pointer';
  displayObject.on('pointerdown', () => onEvent(`${label}: pointerDown`));
  displayObject.on('pointerup', () => onEvent(`${label}: pointerUp`));
}

function createPixiNode(node: VectorSceneNode, onEvent: (message: string) => void): PIXI.DisplayObject {
  if (node.type === 'container') {
    const container = new PIXI.Container();
    applyNodeTransform(container, node);
    container.addChild(...node.children.map((child) => createPixiNode(child, onEvent)));
    return container;
  }

  if (node.type === 'ellipse') {
    const graphic = new CommandGraphics();
    graphic.beginFill(node.fill).drawEllipse(0, 0, node.rx, node.ry).endFill();
    applyNodeTransform(graphic, node);
    enablePointer(graphic, node.label, onEvent);
    return graphic;
  }

  if (node.type === 'rect') {
    const graphic = new CommandGraphics();
    graphic.beginFill(node.fill).drawRect(node.rectX, node.rectY, node.width, node.height).endFill();
    applyNodeTransform(graphic, node);
    enablePointer(graphic, node.label, onEvent);
    return graphic;
  }

  if (node.type === 'line') {
    const graphic = new CommandGraphics();
    graphic.lineStyle(node.strokeWidth, node.stroke, 1).moveTo(node.x1, node.y1).lineTo(node.x2, node.y2);
    applyNodeTransform(graphic, node);
    enablePointer(graphic, node.label, onEvent);
    return graphic;
  }

  const sprite = new PIXI.Sprite(createDemoSpriteTexture());
  sprite.anchor.set(0.5);
  sprite.width = node.width;
  sprite.height = node.height;
  applyNodeTransform(sprite, node);
  enablePointer(sprite, node.label, onEvent);
  return sprite;
}

function applyNodeTransform(displayObject: PIXI.DisplayObject, node: VectorSceneNode): void {
  displayObject.position.set('x' in node ? (node.x ?? 0) : 0, 'y' in node ? (node.y ?? 0) : 0);
  displayObject.angle = node.angle ?? 0;
  displayObject.scale.set(node.scaleX ?? 1, node.scaleY ?? node.scaleX ?? 1);
}
