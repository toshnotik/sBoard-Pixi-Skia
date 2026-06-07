/// <reference types="vite/client" />

declare module 'canvaskit-wasm/bin/canvaskit.js' {
  const CanvasKitInit: (options?: { locateFile?: (file: string) => string }) => Promise<unknown>;
  export default CanvasKitInit;
}
