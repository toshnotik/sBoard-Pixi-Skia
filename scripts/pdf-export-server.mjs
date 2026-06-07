import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { Canvas, Image } from 'skia-canvas';

const DEFAULT_PORT = Number.parseInt(process.env.PDF_SERVER_PORT ?? '8787', 10);

export function startPdfExportServer(port = DEFAULT_PORT) {
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/api/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    if (request.method !== 'POST' || request.url !== '/api/export-pdf') {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not found');
      return;
    }

    try {
      const payload = JSON.parse(await readBody(request));
      const pdf = await renderPdf(payload);
      response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="sboard-scene.pdf"',
        'Content-Length': pdf.byteLength,
      });
      response.end(pdf);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error instanceof Error ? error.message : 'PDF export failed');
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[pdf] Skia PDF backend listening on http://127.0.0.1:${port}`);
  });

  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  startPdfExportServer();
}

async function renderPdf(payload) {
  const width = numberOr(payload.width, 760);
  const height = numberOr(payload.height, 460);
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  for (const command of payload.commands ?? []) {
    await drawCommand(ctx, command);
  }

  const buffer = await canvas.toBuffer('pdf');
  if (!isUsablePdf(buffer)) {
    throw new Error('Skia backend returned an invalid PDF.');
  }
  return buffer;
}

async function drawCommand(ctx, command) {
  ctx.save();
  concatTransform(ctx, command.transform);

  if (command.kind === 'ellipse') {
    drawEllipse(ctx, command);
  } else if (command.kind === 'rect') {
    drawRect(ctx, command);
  } else if (command.kind === 'polyline') {
    drawPolyline(ctx, command);
  } else if (command.kind === 'sprite') {
    await drawBitmapSprite(ctx, command);
  }

  ctx.restore();
}

function drawEllipse(ctx, command) {
  if (command.fill) {
    ctx.fillStyle = toRgba(command.fill);
    ctx.beginPath();
    ctx.ellipse(command.cx, command.cy, command.rx, command.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (command.stroke) {
    ctx.strokeStyle = toRgba(command.stroke);
    ctx.lineWidth = command.stroke.width;
    ctx.beginPath();
    ctx.ellipse(command.cx, command.cy, command.rx, command.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawRect(ctx, command) {
  if (command.fill) {
    ctx.fillStyle = toRgba(command.fill);
    ctx.fillRect(command.x, command.y, command.width, command.height);
  }

  if (command.stroke) {
    ctx.strokeStyle = toRgba(command.stroke);
    ctx.lineWidth = command.stroke.width;
    ctx.strokeRect(command.x, command.y, command.width, command.height);
  }
}

function drawPolyline(ctx, command) {
  if (!command.stroke || command.points.length < 2) return;
  ctx.strokeStyle = toRgba(command.stroke);
  ctx.lineWidth = command.stroke.width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(command.points[0].x, command.points[0].y);
  for (const point of command.points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

async function drawBitmapSprite(ctx, command) {
  const width = numberOr(command.width, 96);
  const height = numberOr(command.height, 96);
  const spriteCanvas = new Canvas(width, height);
  const spriteCtx = spriteCanvas.getContext('2d');
  const gradient = spriteCtx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#22d3ee');
  gradient.addColorStop(1, '#f97316');
  spriteCtx.fillStyle = gradient;
  spriteCtx.fillRect(0, 0, width, height);
  spriteCtx.fillStyle = 'rgba(255,255,255,0.9)';
  spriteCtx.beginPath();
  spriteCtx.arc(width / 2, height / 2, Math.min(width, height) * 0.29, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.fillStyle = '#111827';
  spriteCtx.font = '700 24px Arial';
  spriteCtx.textAlign = 'center';
  spriteCtx.textBaseline = 'middle';
  spriteCtx.fillText('PNG', width / 2, height / 2 + 2);

  const image = new Image();
  image.src = await spriteCanvas.toBuffer('png');
  ctx.drawImage(
    image,
    -command.anchorX * width,
    -command.anchorY * height,
    width,
    height,
  );
}

function concatTransform(ctx, matrix) {
  if (!matrix) return;
  ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
}

function toRgba(style) {
  const color = style.color.replace('#', '');
  const value = Number.parseInt(color, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${style.alpha ?? 1})`;
}

function numberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error('Payload is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function isUsablePdf(bytes) {
  return bytes.byteLength > 100 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
