import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { computeConsensus } from '../consensus/weighted-voting.js';
import {
  ConsensusMode,
  DEFAULT_WEIGHTING_CONFIG,
  type AudienceInput,
} from '../types/index.js';

const SCHEMA_VERSION = '1.2.0';
const SEED = 0x4f4d4e49;
const SIZES = [10, 100, 250, 500, 1000] as const;
const WARMUP_ITERATIONS = 10;
const MEASURED_ITERATIONS = 50;
const STAGE_POSITION = { x: 50, y: 0 };
const FIXED_NOW = 1_800_000_000_000;
const INPUT_AGE_WINDOW_MS = 5_000;

interface BenchmarkRow {
  inputCount: number;
  iterations: number;
  minMs: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  operationsPerSecond: number;
  outputValue: number;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function createInputs(count: number, seed: number): AudienceInput[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, (_, index) => ({
    id: `bench-${count}-${index}`,
    clientId: `client-${index}`,
    sessionId: 'reproducibility-baseline',
    timestamp: FIXED_NOW - Math.floor(random() * INPUT_AGE_WINDOW_MS),
    parameter: 'intensity',
    value: random(),
    location: {
      x: random() * 100,
      y: random() * 100,
    },
  }));
}

function percentile(sorted: number[], quantile: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil(quantile * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function round(value: number, places = 6): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function outputPathFromArgs(): string {
  const outputFlag = process.argv.indexOf('--output');
  const requested = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;
  if (outputFlag >= 0 && !requested) {
    throw new Error('The --output flag requires a path');
  }
  return resolve(requested ?? 'benchmark-results/consensus-baseline.json');
}

function computeFixedConsensus(inputs: AudienceInput[]) {
  return computeConsensus(
    'intensity',
    inputs,
    STAGE_POSITION,
    DEFAULT_WEIGHTING_CONFIG,
    undefined,
    ConsensusMode.WEIGHTED_AVERAGE,
    FIXED_NOW,
  );
}

function runCase(inputCount: number): BenchmarkRow {
  const inputs = createInputs(inputCount, SEED ^ inputCount);
  let expectedOutput: number | null = null;

  for (let iteration = 0; iteration < WARMUP_ITERATIONS; iteration += 1) {
    const result = computeFixedConsensus(inputs);
    expectedOutput ??= result.value;
    if (result.value !== expectedOutput) {
      throw new Error(`Non-deterministic warm-up output for ${inputCount} inputs`);
    }
  }

  const samples: number[] = [];
  for (let iteration = 0; iteration < MEASURED_ITERATIONS; iteration += 1) {
    const start = performance.now();
    const result = computeFixedConsensus(inputs);
    const duration = performance.now() - start;

    if (result.inputCount !== inputCount || !Number.isFinite(result.value)) {
      throw new Error(`Invalid benchmark result for ${inputCount} inputs`);
    }
    if (expectedOutput === null || result.value !== expectedOutput) {
      throw new Error(`Non-deterministic measured output for ${inputCount} inputs`);
    }

    samples.push(duration);
  }

  if (expectedOutput === null) {
    throw new Error(`Benchmark did not produce an output for ${inputCount} inputs`);
  }

  samples.sort((left, right) => left - right);
  const total = samples.reduce((sum, sample) => sum + sample, 0);
  const mean = total / samples.length;

  return {
    inputCount,
    iterations: MEASURED_ITERATIONS,
    minMs: round(samples[0]),
    meanMs: round(mean),
    p50Ms: round(percentile(samples, 0.5)),
    p95Ms: round(percentile(samples, 0.95)),
    maxMs: round(samples[samples.length - 1]),
    operationsPerSecond: round(1_000 / mean, 3),
    outputValue: round(expectedOutput),
  };
}

async function main(): Promise<void> {
  const rows = SIZES.map(runCase);
  const outputPath = outputPathFromArgs();
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    sourceRevision: process.env.GITHUB_SHA ?? process.env.SOURCE_REVISION ?? null,
    runtime: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      ci: process.env.CI === 'true',
    },
    method: {
      seed: SEED,
      cohortSeedDerivation: 'seed XOR inputCount',
      evaluationTimestampEpochMs: FIXED_NOW,
      inputTimestampPolicy: {
        derivation: 'evaluationTimestampEpochMs - floor(prng * inputAgeWindowMs)',
        inputAgeWindowMs: INPUT_AGE_WINDOW_MS,
        ageRangeMs: {
          minimumInclusive: 0,
          maximumExclusive: INPUT_AGE_WINDOW_MS,
        },
      },
      warmupIterations: WARMUP_ITERATIONS,
      measuredIterations: MEASURED_ITERATIONS,
      timer: 'node:perf_hooks.performance.now',
      statisticDefinition: 'nearest-rank percentile over per-call wall-clock samples',
      determinismCheck: 'all warm-up and measured calls must return the identical consensus value',
      scope: 'in-process computeConsensus only; excludes network, serialization, Socket.IO, Redis, OSC, rendering, and audience-device latency',
      threshold: null,
    },
    results: rows,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.table(rows);
  console.log(`Wrote reproducibility artifact: ${outputPath}`);
  console.log('No performance threshold is asserted by this baseline.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
