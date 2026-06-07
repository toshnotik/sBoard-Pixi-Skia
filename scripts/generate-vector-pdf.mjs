import { readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Canvas, Image } from 'skia-canvas';

const scene = JSON.parse(await readFile(resolve('src/scene/assignmentScene.json'), 'utf8'));
const output = resolve('output/sboard-skia-vector.pdf');

const canvas = new Canvas(scene.width, scene.height);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, scene.width, scene.height);
await drawNode(ctx, scene.root);

await mkdir(dirname(output), { recursive: true });
await canvas.toFile(output, { format: 'pdf' });

console.log(output);

async function drawNode(ctx, node) {
  ctx.save();
  applyTransform(ctx, node);

  if (node.type === 'container') {
    for (const child of node.children) {
      await drawNode(ctx, child);
    }
  } else if (node.type === 'ellipse') {
    ctx.fillStyle = node.fill;
    ctx.beginPath();
    ctx.ellipse(0, 0, node.rx, node.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.type === 'rect') {
    ctx.fillStyle = node.fill;
    ctx.fillRect(node.rectX, node.rectY, node.width, node.height);
  } else if (node.type === 'line') {
    ctx.strokeStyle = node.stroke;
    ctx.lineWidth = node.strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(node.x1, node.y1);
    ctx.lineTo(node.x2, node.y2);
    ctx.stroke();
  } else if (node.type === 'sprite') {
    await drawBitmapSprite(ctx, node.width, node.height);
  }

  ctx.restore();
}

function applyTransform(ctx, node) {
  ctx.translate(node.x ?? 0, node.y ?? 0);
  ctx.rotate(deg(node.angle ?? 0));
  ctx.scale(node.scaleX ?? 1, node.scaleY ?? node.scaleX ?? 1);
}

async function drawBitmapSprite(ctx, width, height) {
  const spriteCanvas = new Canvas(width, height);
  const spriteCtx = spriteCanvas.getContext('2d');
  const gradient = spriteCtx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#22d3ee');
  gradient.addColorStop(1, '#f97316');
  spriteCtx.fillStyle = gradient;
  spriteCtx.fillRect(0, 0, width, height);
  spriteCtx.fillStyle = 'rgba(255,255,255,0.9)';
  spriteCtx.beginPath();
  spriteCtx.arc(width / 2, height / 2, 28, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.fillStyle = '#111827';
  spriteCtx.font = '700 24px Arial';
  spriteCtx.textAlign = 'center';
  spriteCtx.textBaseline = 'middle';
  spriteCtx.fillText('PNG', width / 2, height / 2 + 2);

  const image = new Image();
  image.src = await spriteCanvas.toBuffer('png');
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
}

function deg(value) {
  return (value * Math.PI) / 180;
}
