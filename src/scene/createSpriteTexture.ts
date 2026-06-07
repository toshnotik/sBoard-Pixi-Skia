import * as PIXI from 'pixi.js-legacy';

export function createDemoSpriteTexture(): PIXI.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  const gradient = ctx.createLinearGradient(0, 0, 96, 96);
  gradient.addColorStop(0, '#22d3ee');
  gradient.addColorStop(1, '#f97316');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 96, 96);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(48, 48, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.font = '700 24px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PNG', 48, 50);

  return PIXI.Texture.from(canvas.toDataURL('image/png'));
}
