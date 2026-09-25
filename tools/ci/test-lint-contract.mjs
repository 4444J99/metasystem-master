import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { ESLint } from 'eslint';

const cwd = fileURLToPath(new URL('../../', import.meta.url));
const eslint = new ESLint({ cwd });

for (const filePath of [
  'packages/performance-sdk/src/probe.ts',
  'packages/core-engine/src/probe.ts',
  'packages/audio-synthesis-bridge/src/probe.ts',
  'docs/reference/poc-v0.1.0-parent/poc-v0.1.0/client/src/probe.tsx',
  'docs/reference/poc-v0.1.0-parent/poc-v0.1.0/server/src/probe.ts',
]) {
  test(`lint rejects unreachable code in ${filePath}`, async () => {
    const [result] = await eslint.lintText('export function f() { return 1; throw new Error("unreachable"); }', { filePath });
    assert.ok(result.messages.some(({ ruleId }) => ruleId === 'no-unreachable'));
    assert.ok(result.errorCount > 0);
  });
}

test('lint accepts a valid TypeScript module', async () => {
  const [result] = await eslint.lintText('export const value: number = 1;', {
    filePath: 'packages/performance-sdk/src/probe.ts',
  });
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 0);
});

test('lint rejects duplicate object keys', async () => {
  const [result] = await eslint.lintText('export const object = { key: 1, key: 2 };', {
    filePath: 'packages/performance-sdk/src/probe.ts',
  });
  assert.ok(result.messages.some(({ ruleId }) => ruleId === 'no-dupe-keys'));
});

// TypeScript 7 provides the package compilers; only ESLint needs the TS6 API.
test('lint API is isolated from the TypeScript 7 application compilers', () => {
  const rootRequire = createRequire(join(cwd, 'package.json'));
  const lintApi = rootRequire('typescript');
  assert.match(lintApi.version, /^6\./);
  assert.equal(typeof lintApi.createSourceFile, 'function');
  for (const path of ['packages/core-engine', 'packages/audio-synthesis-bridge', 'packages/performance-sdk']) {
    const packageRequire = createRequire(join(cwd, path, 'package.json'));
    assert.match(packageRequire('typescript/package.json').version, /^7\./);
  }
});
