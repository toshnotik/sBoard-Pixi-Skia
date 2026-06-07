import * as PIXI from 'pixi.js-legacy';
import './styles.css';
import { bindSkiaPointerEvents } from './events/skiaHitTest';
import { addRandomShape, createDemoScenes } from './scene/scenes';
import { exportCurrentSceneToPdf } from './skia/exportScenePdf';
import { SkiaCanvasView } from './skia/skiaCanvasView';

const WIDTH = 760;
const HEIGHT = 460;

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('App root was not found.');

root.innerHTML = `
  <main class="layout">
    <header class="topbar">
      <div>
        <h1>sBoard Pixi + Skia</h1>
        <p>Pixi canvas слева, Skia CanvasKit справа.</p>
      </div>
      <div class="actions">
        <button id="add-shape">Случайная фигура</button>
        <button id="switch-scene">Следующая сцена</button>
        <button id="export-pdf">Экспорт PDF</button>
      </div>
    </header>
    <section class="stage-grid">
      <div class="stage-shell">
        <div class="stage-title">PIXI.Application forceCanvas=true</div>
        <div id="pixi-stage" class="stage"></div>
      </div>
      <div class="stage-shell">
        <div class="stage-title">Skia CanvasKit render</div>
        <canvas id="skia-stage" class="stage-canvas"></canvas>
      </div>
    </section>
    <footer class="statusbar">
      <span id="scene-label"></span>
      <span id="status">Готово</span>
    </footer>
  </main>
`;

const pixiStage = document.querySelector<HTMLDivElement>('#pixi-stage');
const skiaCanvas = document.querySelector<HTMLCanvasElement>('#skia-stage');
const addButton = document.querySelector<HTMLButtonElement>('#add-shape');
const switchButton = document.querySelector<HTMLButtonElement>('#switch-scene');
const exportButton = document.querySelector<HTMLButtonElement>('#export-pdf');
const status = document.querySelector<HTMLSpanElement>('#status');
const sceneLabel = document.querySelector<HTMLSpanElement>('#scene-label');

if (!pixiStage || !skiaCanvas || !addButton || !switchButton || !exportButton || !status || !sceneLabel) {
  throw new Error('UI was not mounted correctly.');
}

const ui = {
  pixiStage,
  skiaCanvas,
  addButton,
  switchButton,
  exportButton,
  status,
  sceneLabel,
};

const pixiApp = new PIXI.Application({
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: 0x1c1f26,
  antialias: true,
  forceCanvas: true,
});

ui.pixiStage.appendChild(pixiApp.view as HTMLCanvasElement);
(pixiApp.view as HTMLCanvasElement).className = 'stage-canvas';

const skiaView = new SkiaCanvasView(ui.skiaCanvas, WIDTH, HEIGHT);
skiaView.resizeForDpr();

const eventLog = (message: string) => {
  ui.status.textContent = message;
};

const scenes = createDemoScenes(eventLog);
let sceneIndex = 0;
let unbindSkiaEvents: (() => void) | undefined;

void bootstrap();

ui.addButton.addEventListener('click', async () => {
  addRandomShape(scenes[sceneIndex].container, eventLog);
  await renderSkia();
});

ui.switchButton.addEventListener('click', () => {
  mountScene((sceneIndex + 1) % scenes.length);
});

ui.exportButton.addEventListener('click', async () => {
  ui.status.textContent = 'Экспорт PDF...';
  try {
    await exportCurrentSceneToPdf(scenes[sceneIndex].container, WIDTH, HEIGHT);
    ui.status.textContent = 'PDF экспортирован';
  } catch (error) {
    ui.status.textContent = error instanceof Error ? error.message : 'PDF экспорт не удался';
  }
});

async function mountScene(index: number): Promise<void> {
  sceneIndex = index;
  pixiApp.stage.removeChildren();
  pixiApp.stage.addChild(scenes[sceneIndex].container);
  ui.sceneLabel.textContent = scenes[sceneIndex].label;
  unbindSkiaEvents?.();
  unbindSkiaEvents = bindSkiaPointerEvents(ui.skiaCanvas, scenes[sceneIndex].container);
  await renderSkia();
}

async function renderSkia(): Promise<void> {
  await skiaView.render(scenes[sceneIndex].container);
}

async function bootstrap(): Promise<void> {
  ui.status.textContent = 'Загрузка CanvasKit...';
  await skiaView.init();
  await mountScene(0);
  ui.status.textContent = 'Готово';
}
