import CanvasKitInit from 'canvaskit-wasm/bin/canvaskit.js';
import wasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url';

export type CanvasKit = Record<string, any>;

let canvasKitPromise: Promise<CanvasKit> | null = null;

export function loadCanvasKit(): Promise<CanvasKit> {
  canvasKitPromise ??= CanvasKitInit({
    locateFile: (file) => (file.endsWith('.wasm') ? wasmUrl : file),
  }) as Promise<CanvasKit>;

  return canvasKitPromise;
}
