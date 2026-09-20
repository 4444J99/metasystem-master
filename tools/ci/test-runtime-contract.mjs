import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { NODE_ENGINE, ROOT, MANIFESTS, isSupportedNode, assertSupportedNode, checkManifests } from './check-runtime.mjs';

for (const version of ['22.12.0', '22.12.1', '22.16.0', '22.99.0', '24.0.0', '24.1.0', '26.0.0', '27.0.0', '22.12.0+build.1']) {
  test(`accept supported Node ${version}`, () => assert.equal(isSupportedNode(version), true));
}
for (const version of ['18.20.8', '20.19.0', '22.0.0', '22.11.99', '23.0.0', '25.0.0', '22.12', '22.12.0-rc.1', '26.0.0-nightly', '022.12.0', '', 'garbage', null, 22]) {
  test(`reject unsupported or malformed Node ${String(version)}`, () => {
    assert.equal(isSupportedNode(version), false);
    assert.throws(() => assertSupportedNode(version), /Unsupported Node/);
  });
}

test('the executing runtime meets the contract', () => assert.doesNotThrow(() => assertSupportedNode()));
test('real manifests consistently declare engines and substantive typechecks', () => {
  assert.equal(checkManifests(), 6);
});

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'metasystem-runtime-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of MANIFESTS) {
    const dest = join(root, path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, JSON.stringify({ engines: { node: NODE_ENGINE }, scripts: { typecheck: 'tsc --noEmit' } }));
  }
  return root;
}

for (const path of MANIFESTS) {
  test(`fail closed for Node 18 drift in ${path}`, (t) => {
    const root = fixture(t);
    writeFileSync(join(root, path), JSON.stringify({ engines: { node: '>=18.0.0' }, scripts: { typecheck: 'tsc --noEmit' } }));
    assert.throws(() => checkManifests(root), /engines.node must be/);
  });
}
for (const path of MANIFESTS.slice(1)) {
  test(`reject missing typecheck in ${path}`, (t) => {
    const root = fixture(t);
    writeFileSync(join(root, path), JSON.stringify({ engines: { node: NODE_ENGINE }, scripts: {} }));
    assert.throws(() => checkManifests(root), /typecheck must execute/);
  });
}

test('missing manifest is an error, not an omitted check', (t) => {
  const root = fixture(t);
  rmSync(join(root, MANIFESTS[1]));
  assert.throws(() => checkManifests(root), /Cannot read runtime contract/);
});
test('invalid JSON is an error', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, MANIFESTS[0]), '{invalid');
  assert.throws(() => checkManifests(root), /Cannot read runtime contract/);
});
test('null manifest is an error', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, MANIFESTS[0]), 'null');
  assert.throws(() => checkManifests(root), /engines.node must be/);
});
test('check:runtime invokes the runtime contract', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(manifest.scripts['check:runtime'], 'node tools/ci/check-runtime.mjs');
});
test('CLI works outside the repository working directory', () => {
  const result = spawnSync(process.execPath, [join(ROOT, 'tools/ci/check-runtime.mjs')], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /6 manifests/);
});
test('CI uses the supported Node selector and does not tolerate validation failures', () => {
  const workflow = readFileSync(join(ROOT, '.github/workflows/metasystem-ci.yml'), 'utf8');
  assert.equal(readFileSync(join(ROOT, '.nvmrc'), 'utf8').trim(), '22');
  const setups = workflow.match(/uses: actions\/setup-node@/g) ?? [];
  const selectors = workflow.match(/node-version-file: \.nvmrc/g) ?? [];
  assert.ok(setups.length >= 3);
  assert.equal(selectors.length, setups.length);
  assert.doesNotMatch(workflow, /^\s*node-version:/m);
  assert.doesNotMatch(workflow, /^\s*continue-on-error:/m);
  assert.doesNotMatch(workflow, /\|\|\s*(?:true|:)(?:\s|$)/m);
  assert.match(workflow, /pnpm --filter @omni-dromenon\/core-engine exec vitest run/);
  assert.match(workflow, /node --test tools\/ci\/test-runtime-contract\.mjs/);
  assert.match(workflow, /pnpm run typecheck/);
  assert.match(workflow, /pnpm run build/);
  assert.match(workflow, /npm ci/);
});
