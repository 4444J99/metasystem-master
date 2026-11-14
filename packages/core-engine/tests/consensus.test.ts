import { describe, expect, it } from 'vitest';
import {
  analyzeCluster,
  applyOverride,
  calculateConsensusWeight,
  calculateSpatialWeight,
  calculateTemporalWeight,
  computeConsensus,
  isOverrideActive,
  removeOutliers,
  smoothValue,
  standardDeviation,
  weightedMean,
  weightInputs,
} from '../src/consensus/weighted-voting.js';
import {
  ConsensusMode,
  DEFAULT_WEIGHTING_CONFIG,
  type AudienceInput,
  type PerformerOverride,
} from '../src/types/index.js';

const STAGE = { x: 50, y: 0 };
const NOW = 1_800_000_000_000;

function input(
  index: number,
  value: number,
  timestamp = NOW,
  location: { x: number; y: number } | undefined = STAGE,
): AudienceInput {
  return {
    id: `input-${index}`,
    clientId: `client-${index}`,
    sessionId: 'functional-test',
    timestamp,
    parameter: 'intensity',
    value,
    location,
  };
}

function inputs(values: number[]): AudienceInput[] {
  return values.map((value, index) => input(index, value));
}

describe('weight calculation', () => {
  it('assigns maximum spatial weight at the stage', () => {
    expect(calculateSpatialWeight(STAGE, STAGE, DEFAULT_WEIGHTING_CONFIG)).toBeCloseTo(1, 8);
  });

  it('assigns lower spatial weight to a more distant location', () => {
    const near = calculateSpatialWeight({ x: 50, y: 20 }, STAGE, DEFAULT_WEIGHTING_CONFIG);
    const far = calculateSpatialWeight({ x: 50, y: 80 }, STAGE, DEFAULT_WEIGHTING_CONFIG);
    expect(near).toBeGreaterThan(far);
  });

  it('uses the declared fallback for an unknown location', () => {
    expect(calculateSpatialWeight(undefined, STAGE, DEFAULT_WEIGHTING_CONFIG)).toBe(0.5);
  });

  it('assigns lower temporal weight to older input', () => {
    const recent = calculateTemporalWeight(NOW - 1_000, NOW, DEFAULT_WEIGHTING_CONFIG);
    const older = calculateTemporalWeight(NOW - 4_000, NOW, DEFAULT_WEIGHTING_CONFIG);
    expect(recent).toBeGreaterThan(older);
  });

  it('assigns minimal temporal weight outside the configured window', () => {
    const timestamp = NOW - DEFAULT_WEIGHTING_CONFIG.temporalWindowMs - 1;
    expect(calculateTemporalWeight(timestamp, NOW, DEFAULT_WEIGHTING_CONFIG)).toBe(0.01);
  });

  it('assigns full agreement weight when every input agrees', () => {
    const cohort = inputs([0.5, 0.5, 0.5, 0.5]);
    expect(calculateConsensusWeight(cohort[0], cohort, DEFAULT_WEIGHTING_CONFIG)).toBe(1);
  });

  it('assigns lower agreement weight to an isolated value', () => {
    const cohort = inputs([0.5, 0.5, 0.5, 0.9]);
    expect(calculateConsensusWeight(cohort[3], cohort, DEFAULT_WEIGHTING_CONFIG)).toBeLessThan(0.5);
  });
});

describe('aggregation', () => {
  it('uses 0.5 as the empty weighted-mean value', () => {
    expect(weightedMean([])).toBe(0.5);
  });

  it('returns the arithmetic mean for explicitly uniform weights', () => {
    const weighted = [
      {
        ...input(0, 0.2),
        weight: 1,
        spatialWeight: 1,
        temporalWeight: 1,
        consensusWeight: 1,
      },
      {
        ...input(1, 0.8),
        weight: 1,
        spatialWeight: 1,
        temporalWeight: 1,
        consensusWeight: 1,
      },
    ];
    expect(weightedMean(weighted)).toBeCloseTo(0.5, 8);
  });

  it('reports zero deviation for uniform values', () => {
    const weighted = weightInputs(
      inputs([0.5, 0.5, 0.5]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      NOW,
    );
    expect(standardDeviation(weighted)).toBeCloseTo(0, 8);
  });

  it('reports greater deviation for more dispersed values', () => {
    const uniform = weightInputs(
      inputs([0.4, 0.5, 0.6]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      NOW,
    );
    const dispersed = weightInputs(
      inputs([0.1, 0.5, 0.9]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      NOW,
    );
    expect(standardDeviation(dispersed)).toBeGreaterThan(standardDeviation(uniform));
  });

  it('removes an observation beyond the declared 2.5-sigma threshold', () => {
    const weighted = weightInputs(
      inputs([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.95]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      NOW,
    );
    expect(removeOutliers(weighted)).toHaveLength(weighted.length - 1);
  });

  it('keeps a compact cohort intact', () => {
    const weighted = weightInputs(
      inputs([0.4, 0.5, 0.5, 0.6]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      NOW,
    );
    expect(removeOutliers(weighted)).toHaveLength(weighted.length);
  });

  it('applies exponential smoothing at the declared fraction', () => {
    expect(smoothValue(1, 0, 0.3)).toBeCloseTo(0.3, 8);
    expect(smoothValue(1, 0.5, 0)).toBe(0.5);
    expect(smoothValue(1, 0.5, 1)).toBe(1);
  });
});

describe('cluster analysis', () => {
  it('identifies one cluster for uniform values', () => {
    const analysis = analyzeCluster(
      weightInputs(inputs([0.5, 0.5, 0.5]), STAGE, DEFAULT_WEIGHTING_CONFIG, NOW),
    );
    expect(analysis.clusters).toHaveLength(1);
    expect(analysis.bimodality).toBe(false);
  });

  it('identifies separated, balanced groups as bimodal', () => {
    const analysis = analyzeCluster(
      weightInputs(
        inputs([0.1, 0.1, 0.1, 0.9, 0.9, 0.9]),
        STAGE,
        DEFAULT_WEIGHTING_CONFIG,
        NOW,
      ),
    );
    expect(analysis.clusters).toHaveLength(2);
    expect(analysis.bimodality).toBe(true);
  });

  it('uses the two densest clusters rather than the first two value clusters', () => {
    const analysis = analyzeCluster(
      weightInputs(
        inputs([0.01, 0.35, 0.35, 0.35, 0.35, 0.9, 0.9, 0.9, 0.9]),
        STAGE,
        DEFAULT_WEIGHTING_CONFIG,
        NOW,
      ),
    );
    expect(analysis.clusters).toHaveLength(3);
    expect(analysis.bimodality).toBe(true);
  });

  it('returns an empty analysis for an empty cohort', () => {
    expect(analyzeCluster([])).toEqual({
      clusters: [],
      dominantCluster: null,
      entropy: 0,
      bimodality: false,
    });
  });
});

describe('consensus computation', () => {
  it('returns the default result for no inputs', () => {
    const result = computeConsensus(
      'intensity',
      [],
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      undefined,
      ConsensusMode.WEIGHTED_AVERAGE,
      NOW,
    );
    expect(result.value).toBe(0.5);
    expect(result.inputCount).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.timestamp).toBe(NOW);
  });

  it('computes a bounded weighted-average result', () => {
    const result = computeConsensus(
      'intensity',
      inputs([0.3, 0.5, 0.7]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      undefined,
      ConsensusMode.WEIGHTED_AVERAGE,
      NOW,
    );
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(1);
    expect(result.inputCount).toBe(3);
  });

  it('computes median mode without mutating the source cohort', () => {
    const cohort = inputs([0.9, 0.1, 0.5]);
    const original = cohort.map(({ value }) => value);
    const result = computeConsensus(
      'intensity',
      cohort,
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      undefined,
      ConsensusMode.MEDIAN,
      NOW,
    );
    expect(result.value).toBe(0.5);
    expect(cohort.map(({ value }) => value)).toEqual(original);
  });

  it('smooths a computed result toward the previous value', () => {
    const result = computeConsensus(
      'intensity',
      inputs([1, 1, 1]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      0,
      ConsensusMode.WEIGHTED_AVERAGE,
      NOW,
    );
    expect(result.value).toBeGreaterThan(0);
    expect(result.value).toBeLessThan(1);
  });

  it('reports higher confidence for greater agreement', () => {
    const agreeing = computeConsensus(
      'intensity',
      inputs([0.5, 0.5, 0.5]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      undefined,
      ConsensusMode.WEIGHTED_AVERAGE,
      NOW,
    );
    const disagreeing = computeConsensus(
      'intensity',
      inputs([0.1, 0.5, 0.9]),
      STAGE,
      DEFAULT_WEIGHTING_CONFIG,
      undefined,
      ConsensusMode.WEIGHTED_AVERAGE,
      NOW,
    );
    expect(agreeing.confidence).toBeGreaterThan(disagreeing.confidence);
  });
});

describe('performer override', () => {
  it('applies absolute and lock overrides', () => {
    const absolute: PerformerOverride = {
      performerId: 'performer-1',
      parameter: 'intensity',
      value: 0.8,
      mode: 'absolute',
    };
    const lock: PerformerOverride = { ...absolute, mode: 'lock', value: 0.7 };
    expect(applyOverride(0.5, absolute)).toBe(0.8);
    expect(applyOverride(0.5, lock)).toBe(0.7);
  });

  it('applies a blend override', () => {
    const override: PerformerOverride = {
      performerId: 'performer-1',
      parameter: 'intensity',
      value: 1,
      mode: 'blend',
      blendFactor: 0.5,
    };
    expect(applyOverride(0, override)).toBeCloseTo(0.5, 8);
  });

  it('keeps consensus when no override exists', () => {
    expect(applyOverride(0.7, null)).toBe(0.7);
  });

  it('distinguishes unbounded, active, and expired overrides at a fixed clock', () => {
    const base: PerformerOverride = {
      performerId: 'performer-1',
      parameter: 'intensity',
      value: 0.8,
      mode: 'absolute',
    };
    expect(isOverrideActive(base, NOW)).toBe(true);
    expect(isOverrideActive({ ...base, expiresAt: NOW + 1 }, NOW)).toBe(true);
    expect(isOverrideActive({ ...base, expiresAt: NOW }, NOW)).toBe(false);
    expect(isOverrideActive(null, NOW)).toBe(false);
  });
});
