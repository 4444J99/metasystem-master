import { readFile, readdir, stat } from 'node:fs/promises';

const CORE_PACKAGE = 'packages/core-engine/package.json';
const WORKFLOW = '.github/workflows/core-engine-evidence.yml';
const BENCHMARK = 'packages/core-engine/src/benchmarks/consensus-bench.ts';
const TEST_DIRECTORY = 'packages/core-engine/tests';

const REQUIRED_TESTS = new Set([
  'bus.test.ts',
  'consensus.deterministic.test.ts',
  'consensus.test.ts',
  'parameter-aggregation.test.ts',
]);

const EXPECTED_SCRIPTS = {
  typecheck: 'tsc --noEmit',
  test: 'vitest run --reporter=verbose',
  'test:bench': 'node --import tsx src/benchmarks/consensus-bench.ts',
  evidence: 'pnpm typecheck && pnpm test && pnpm test:bench',
};

const failures = [];

function requireCondition(condition, id, detail) {
  if (!condition) failures.push({ id, detail });
}

const packageJson = JSON.parse(await readFile(CORE_PACKAGE, 'utf8'));
for (const [name, expected] of Object.entries(EXPECTED_SCRIPTS)) {
  requireCondition(
    packageJson.scripts?.[name] === expected,
    `script-${name}`,
    `${CORE_PACKAGE} must define ${JSON.stringify(name)} as ${JSON.stringify(expected)}`,
  );
}

const testFiles = (await readdir(TEST_DIRECTORY))
  .filter((name) => name.endsWith('.test.ts'));
for (const required of REQUIRED_TESTS) {
  requireCondition(
    testFiles.includes(required),
    `required-test-${required}`,
    `${TEST_DIRECTORY}/${required} is required by the evidence lane`,
  );
}
for (const name of testFiles) {
  const file = `${TEST_DIRECTORY}/${name}`;
  const metadata = await stat(file);
  requireCondition(
    metadata.size > 0,
    `empty-test-${name}`,
    `${file} is empty and therefore cannot be counted as executable coverage`,
  );
}

const workflow = await readFile(WORKFLOW, 'utf8');
const requiredWorkflowFragments = [
  'node --test tools/check-core-claim-boundaries.test.mjs',
  'node tools/check-core-claim-boundaries.mjs',
  'node tools/check-core-evidence-structure.mjs',
  'pnpm install --frozen-lockfile',
  'pnpm --filter @omni-dromenon/core-engine typecheck',
  'pnpm --filter @omni-dromenon/core-engine test',
  'pnpm --filter @omni-dromenon/core-engine test:bench',
  'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  'if-no-files-found: error',
];
for (const fragment of requiredWorkflowFragments) {
  requireCondition(
    workflow.includes(fragment),
    `workflow-${fragment}`,
    `${WORKFLOW} is missing ${JSON.stringify(fragment)}`,
  );
}

const benchmark = await readFile(BENCHMARK, 'utf8');
requireCondition(
  benchmark.includes("scope: 'in-process computeConsensus only;"),
  'benchmark-scope',
  `${BENCHMARK} must declare its in-process scope`,
);
requireCondition(
  benchmark.includes('threshold: null'),
  'benchmark-no-threshold',
  `${BENCHMARK} must preserve the threshold-free baseline`,
);
requireCondition(
  benchmark.includes("sourceRevision: process.env.GITHUB_SHA ?? process.env.SOURCE_REVISION ?? null"),
  'benchmark-source-revision',
  `${BENCHMARK} must record an externally supplied source revision when available`,
);

if (failures.length > 0) {
  console.error('Core evidence-lane structure check failed:\n');
  for (const failure of failures) {
    console.error(`[${failure.id}] ${failure.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Core evidence-lane structure check passed: ${testFiles.length} non-empty test files, ${Object.keys(EXPECTED_SCRIPTS).length} scripts, workflow wiring, and benchmark boundaries are present.`,
  );
  console.log('This static gate does not execute TypeScript, tests, or benchmarks.');
}
