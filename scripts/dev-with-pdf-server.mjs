import { spawn } from 'node:child_process';
import { startPdfExportServer } from './pdf-export-server.mjs';

const server = startPdfExportServer();
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const vite = spawn(npm, ['run', 'vite', '--', '--port', '5173'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

function shutdown() {
  server.close();
  vite.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
vite.on('exit', (code) => {
  server.close();
  process.exit(code ?? 0);
});
