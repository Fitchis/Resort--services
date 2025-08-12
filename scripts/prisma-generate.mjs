#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

function isAccelerateUrl(url) {
  return typeof url === 'string' && url.startsWith('prisma://');
}

const dbUrl = process.env.DATABASE_URL;
// Also allow an override env to force no-engine
const forceNoEngine = process.env.USE_PRISMA_ACCELERATE === '1' || process.env.PRISMA_GENERATE_NO_ENGINE === '1';
const noEngine = isAccelerateUrl(dbUrl) || forceNoEngine;

const isWin = process.platform === 'win32';
const prismaBin = path.join(process.cwd(), 'node_modules', '.bin', isWin ? 'prisma.cmd' : 'prisma');

const args = ['generate'];
if (noEngine) args.push('--no-engine');

const res = spawnSync(prismaBin, args, { stdio: 'inherit' });
if (res.error || res.status !== 0) {
  // Fallback to npx if direct bin failed
  spawnSync(isWin ? 'npx.cmd' : 'npx', ['prisma', ...args], { stdio: 'inherit' });
}
