import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Match the resolved Vitest 5 engine range; >=22.12 alone also admits Node 23/25.
export const NODE_ENGINE = '^22.12.0 || ^24.0.0 || >=26.0.0';
export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const MANIFESTS = Object.freeze([
  'package.json',
  'packages/audio-synthesis-bridge/package.json',
  'packages/core-engine/package.json',
  'packages/performance-sdk/package.json',
  'docs/reference/poc-v0.1.0-parent/poc-v0.1.0/client/package.json',
  'docs/reference/poc-v0.1.0-parent/poc-v0.1.0/server/package.json',
]);

export function isSupportedNode(version) {
  if (typeof version !== 'string') return false;
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\+[0-9A-Za-z.-]+)?$/.exec(version);
  if (!match) return false;
  const [major, minor, patch] = match.slice(1, 4).map(Number);
  if (![major, minor, patch].every(Number.isSafeInteger)) return false;
  return major >= 26 || major === 24 || (major === 22 && minor >= 12);
}

export function assertSupportedNode(version = process.versions.node) {
  if (!isSupportedNode(version)) {
    throw new Error(`Unsupported Node ${version}; required ${NODE_ENGINE}. Run nvm use before installing.`);
  }
}

export function checkManifests(root = ROOT) {
  for (const path of MANIFESTS) {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(resolve(root, path), 'utf8'));
    } catch (error) {
      throw new Error(`Cannot read runtime contract at ${path}: ${error.message}`);
    }
    if (manifest?.engines?.node !== NODE_ENGINE) {
      throw new Error(`${path}: engines.node must be ${NODE_ENGINE}`);
    }
    if (path !== 'package.json' && manifest?.scripts?.typecheck !== 'tsc --noEmit') {
      throw new Error(`${path}: typecheck must execute tsc --noEmit, not silently skip the package`);
    }
  }
  return MANIFESTS.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertSupportedNode();
    const count = checkManifests();
    console.log(`Runtime contract passed: Node ${process.versions.node}; ${count} manifests.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
