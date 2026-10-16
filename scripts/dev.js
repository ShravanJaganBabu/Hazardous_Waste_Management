import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const backendDir = path.resolve(rootDir, 'backend');
const frontendDir = path.resolve(rootDir, 'frontend');

const nodeExec = process.execPath;
const viteCli = path.resolve(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');
const tscCli = path.resolve(backendDir, 'node_modules', 'typescript', 'bin', 'tsc');
const serverJs = path.resolve(backendDir, 'dist', 'server.js');

console.log('\x1b[36m%s\x1b[0m', '============================================================');
console.log('\x1b[32m%s\x1b[0m', '  HAZTRACK // DUAL LAUNCH ENGINE');
console.log('\x1b[36m%s\x1b[0m', '  Starting Backend (Port 5000) & Frontend (Port 5173)...');
console.log('\x1b[36m%s\x1b[0m', '============================================================\n');

let backendProcess = null;
let frontendProcess = null;

const startServices = () => {
  // 1. Compile Backend TypeScript cleanly
  console.log('\x1b[34m%s\x1b[0m', '[1/2] Building HazTrack backend...');
  const build = spawn(nodeExec, [tscCli], {
    cwd: backendDir,
    stdio: 'inherit',
  });

  build.on('close', (code) => {
    if (code !== 0) {
      console.error('\x1b[31m%s\x1b[0m', '[ERROR] Backend compilation failed.');
      return;
    }

    console.log('\x1b[32m%s\x1b[0m', '[HAZTRACK] Backend compiled. Starting API Server...');
    backendProcess = spawn(nodeExec, [serverJs], {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true' },
    });
  });

  // 2. Start Frontend Vite Dev Server
  console.log('\x1b[34m%s\x1b[0m', '[2/2] Starting HazTrack frontend dev server...');
  frontendProcess = spawn(nodeExec, [viteCli], {
    cwd: frontendDir,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' },
  });
};

const cleanup = () => {
  console.log('\n\x1b[33m%s\x1b[0m', '[HAZTRACK] Shutting down development servers...');
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch (_) {}
  }
  if (frontendProcess && !frontendProcess.killed) {
    try { frontendProcess.kill(); } catch (_) {}
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

startServices();
