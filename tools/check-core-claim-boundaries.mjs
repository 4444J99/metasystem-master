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
    pattern: /(?:p95\s+latency\s*(?::|of)\s*(?:\*\*)?2\s*ms|\b2\s*ms\s+p95\s+latency\b)/i,
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

// Only this bounded evidence-denial grammar is exempt. Each list item is a
// noun phrase, so a disclaimer cannot shelter an affirmative clause or an
// unrelated claim later on the same line. Unknown wording remains fail-closed.
const DENIED_CLAIM = String.raw`(?:2 ms P95 latency|100% message delivery|0% errors|a particular participant count|live-performance validation)`;
const EXPLICIT_DENIAL = new RegExp(
  String.raw`(?:^|[.!?] +)The repository does (?:\*\*)?not(?:\*\*)? currently contain a preserved, reproducible artifact supporting earlier claims of ${DENIED_CLAIM}(?:(?:, (?:or )?| or )${DENIED_CLAIM})*\.`,
  'gm',
);

// Track enclosing Markdown code and quotation context through paragraph breaks.
// The exemption applies to authored prose only; ambiguous/unclosed context is
// deliberately not treated as an evidence denial.
function insideQuotationOrCode(source, offset) {
  let fence = null;
  let inlineTicks = 0;
  const quotes = [];
  for (const line of source.slice(0, offset).split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    for (let index = 0; index < line.length; index++) {
      const character = line[index];
      if (character === '\\') { index++; continue; }
      if (character === '`') {
        let length = 1;
        while (line[index + length] === '`') length++;
        if (!inlineTicks) inlineTicks = length;
        else if (inlineTicks === length) inlineTicks = 0;
        index += length - 1;
        continue;
      }
      if (inlineTicks) continue;
      // Apostrophes within words are punctuation, not quotation delimiters.
      if ((character === "'" || character === '’')
        && /[\p{L}\p{N}]/u.test(line[index - 1] ?? '')
        && /[\p{L}\p{N}]/u.test(line[index + 1] ?? '')) continue;
      if (character === quotes.at(-1)) { quotes.pop(); continue; }
      if (character === '“') quotes.push('”');
      else if (character === '‘') quotes.push('’');
      else if (character === '"' || character === "'") quotes.push(character);
    }
  }
  return fence !== null || inlineTicks > 0 || quotes.length > 0;
}

export function findUnsupportedClaims(source) {
  const deniedRanges = [...source.matchAll(EXPLICIT_DENIAL)].filter((match) => {
    // A quoted or explicitly rejected denial is not the author's disclaimer.
    // Scope to the paragraph so quotation context cannot leak across a newline.
    if (insideQuotationOrCode(source, match.index)) return false;
    const previous = source.lastIndexOf('\n\n', match.index);
    const start = previous < 0 ? 0 : previous + 2;
    const next = source.indexOf('\n\n', match.index + match[0].length);
    const paragraph = source.slice(Math.max(0, start), next < 0 ? source.length : next);
    return !/["'“”‘’`>:;]/.test(paragraph)
      && !/\b(?:false|reject(?:ed|s)?|deny|disagree|incorrect|not true)\b/i.test(paragraph);
  }).map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
  const failures = [];
  for (const rule of PROHIBITED) {
    // Inspect every occurrence; an allowed first occurrence must not hide a
    // later affirmative occurrence of the same prohibited pattern.
    const occurrences = new RegExp(rule.pattern.source, `${rule.pattern.flags}g`);
    for (const match of source.matchAll(occurrences)) {
      const denied = deniedRanges.some((range) =>
        match.index >= range.start && match.index + match[0].length <= range.end,
      );
      if (denied) continue;
      failures.push({
        line: lineNumber(source, match.index),
        id: rule.id,
        text: match[0],
        explanation: rule.explanation,
      });
    }
  }
  return failures;
}

async function main() {
  const failures = [];
  for (const path of ACTIVE_SURFACES) {
    const source = await readFile(path, 'utf8');
    failures.push(...findUnsupportedClaims(source).map((failure) => ({path, ...failure})));
  }
  if (failures.length > 0) {
    console.error('Unsupported active claim language detected:\n');
    for (const failure of failures) {
      console.error(`${failure.path}:${failure.line} [${failure.id}] ${JSON.stringify(failure.text)}`);
      console.error(`  ${failure.explanation}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`Claim-boundary check passed for ${ACTIVE_SURFACES.length} active surfaces and ${PROHIBITED.length} prohibited patterns.`);
    console.log('Historical cold storage and explicitly labeled target tables are outside this narrow gate.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
