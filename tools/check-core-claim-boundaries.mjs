import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ACTIVE_SURFACES = [
  'README.md',
  'CLAUDE.md',
  'packages/core-engine/README.md',
  'packages/core-engine/package.json',
  'packages/core-engine/src/benchmarks/consensus-bench.ts',
  'packages/core-engine/src/consensus/weighted-voting.ts',
  'packages/core-engine/src/consensus/parameter-aggregation.ts',
  'packages/core-engine/src/bus/parameter-bus.ts',
  'packages/core-engine/src/bus/audience-inputs.ts',
  'packages/core-engine/src/bus/performer-subscriptions.ts',
  'packages/core-engine/src/server.ts',
  'packages/core-engine/tests/consensus.test.ts',
  'packages/core-engine/tests/consensus.deterministic.test.ts',
  'packages/core-engine/tests/parameter-aggregation.test.ts',
  'packages/core-engine/tests/bus.test.ts',
  'examples/generative-music/README.md',
  'examples/generative-music/src/server/index.js',
  'infra/web/index.html',
  'docs/business/GRANT_MATERIALS/ars-electronica-narrative-DRAFT.md',
];

const PROHIBITED = [
  {
    id: 'validated-poc',
    pattern: /proof-of-concept\s+validated/i,
    explanation: 'A proof-of-concept may not be described as validated without a named evidence object.',
  },
  {
    id: 'validated-p95',
    pattern: /validated\s*:\s*p95\s+latency/i,
    explanation: 'The earlier source-level P95 validation statement has no preserved matching artifact.',
  },
  {
    id: 'two-ms-result',
    pattern: /p95\s+latency\s*(?::|of)\s*(?:\*\*)?2\s*ms/i,
    explanation: 'The 2 ms result is not currently supported by a preserved artifact.',
  },
  {
    id: 'five-ms-result',
    pattern: /p95\s+latency\s*<\s*5\s*ms/i,
    explanation: 'The <5 ms source claim is not currently supported by a preserved artifact.',
  },
  {
    id: 'perfect-delivery',
    pattern: /100\s*%\s+(?:message\s+)?delivery/i,
    explanation: 'No current end-to-end delivery artifact supports a perfect-delivery statement.',
  },
  {
    id: 'zero-errors',
    pattern: /0\s*%\s+error(?:s|\s+rate)?/i,
    explanation: 'No current end-to-end error artifact supports a zero-error statement.',
  },
  {
    id: 'production-ready-badge',
    pattern: /status-badge[^\n>]*production[- ]ready/i,
    explanation: 'The active public surface may not label the project production ready.',
  },
  {
    id: 'concurrency-with-ease',
    pattern: /handles\s+websocket\s+concurrency\s+with\s+ease/i,
    explanation: 'Source presence is not capacity evidence.',
  },
  {
    id: 'stadium-capacity',
    pattern: /stadium-sized\s+crowds/i,
    explanation: 'No current load artifact supports stadium-scale language.',
  },
  {
    id: 'sub-one-five-load',
    pattern: /load(?:ing|s)?\s+in\s+under\s+1\.5\s+seconds/i,
    explanation: 'No preserved browser-load artifact supports this claim.',
  },
];

function lineNumber(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

// Only a controlled evidence-disclaimer grammar grants an exemption. Soft line
// wraps and Markdown emphasis are normalized; offsets still map to the source.
export function findFailures(source, path = '<fixture>') {
  const offsets = [];
  let normalized = '';
  for (let i = 0; i < source.length; i += 1) {
    if ('*_`'.includes(source[i])) continue;
    offsets.push(i);
    normalized += source[i];
  }
  const disclaimer = /\bThe\s+repository\s+does\s+not\s+currently\s+contain\s+a\s+preserved,\s+reproducible\s+artifact\s+supporting\s+earlier\s+claims\s+of\s+([^.!?;]+)[.!?]/gi;
  const exclusions = [];
  for (const match of normalized.matchAll(disclaimer)) {
    // Embedded quotations, hypothetical clauses, and negations of the
    // disclaimer are not the controlled standalone disclaimer.
    const prefix = normalized.slice(0, match.index).split(/[.!?]/).at(-1);
    if (prefix.trim() !== '') continue;
    // Fail closed if the list contains a new affirmative clause or unknown item.
    const items = match[1].split(',').map(item => item.trim().replace(/^(?:and|or)\s+/i, '').replace(/\s+/g, ' '));
    const item = /^(?:2 ms P95 latency|100\s*% (?:message )?delivery|0\s*% errors|a particular participant count|live-performance validation)$/i;
    if (items.every(value => item.test(value))) exclusions.push([match.index, match.index + match[0].length]);
  }
  const failures = [];
  for (const rule of PROHIBITED) {
    for (const match of normalized.matchAll(new RegExp(rule.pattern.source, 'gi'))) {
      if (exclusions.some(([start, end]) => match.index >= start && match.index + match[0].length <= end)) continue;
      failures.push({ path, line: lineNumber(source, offsets[match.index]), id: rule.id,
        text: match[0], explanation: rule.explanation });
    }
  }
  return failures;
}

async function main() {
  const failures = [];
  for (const path of ACTIVE_SURFACES) {
    failures.push(...findFailures(await readFile(path, 'utf8'), path));
  }

  if (failures.length > 0) {
    console.error('Unsupported active claim language detected:\n');
    for (const failure of failures) {
      console.error(
        `${failure.path}:${failure.line} [${failure.id}] ${JSON.stringify(failure.text)}`,
      );
      console.error(`  ${failure.explanation}`);
    }
    process.exitCode = 1;
  } else {
    console.log(
      `Claim-boundary check passed for ${ACTIVE_SURFACES.length} active surfaces and ${PROHIBITED.length} prohibited patterns.`,
    );
    console.log('Historical cold storage and explicitly labeled target tables are outside this narrow gate.');
  }

}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
