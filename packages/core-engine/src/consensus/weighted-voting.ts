/**
 * Weighted voting for the Omni-Dromenon core engine.
 *
 * The module implements spatial, temporal, and agreement weighting for
 * audience inputs. Performance is measured by the seeded benchmark in
 * `src/benchmarks/consensus-bench.ts`; this source file asserts no latency
 * threshold or production-capacity result.
 */

import {
  type AudienceInput,
  type WeightedInput,
  type WeightingConfig,
  type ConsensusResult,
  type PerformerOverride,
  type InputCluster,
  type ClusterAnalysis,
  ConsensusMode,
  DEFAULT_WEIGHTING_CONFIG,
} from '../types/index.js';

/** Calculate spatial weight using exponential decay from the stage. */
export function calculateSpatialWeight(
  location: { x: number; y: number } | undefined,
  stagePosition: { x: number; y: number },
  config: WeightingConfig,
): number {
  if (!location) return 0.5;

  const dx = location.x - stagePosition.x;
  const dy = location.y - stagePosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const normalizedDistance = distance / 100;

  return Math.exp(-config.spatialDecayRate * normalizedDistance);
}

/** Calculate temporal weight using exponential decay from an explicit clock. */
export function calculateTemporalWeight(
  inputTimestamp: number,
  currentTime: number,
  config: WeightingConfig,
): number {
  // Treat future-dated input as age zero rather than allowing clock skew to
  // produce a temporal component greater than one.
  const ageMs = Math.max(0, currentTime - inputTimestamp);

  if (ageMs > config.temporalWindowMs) {
    return 0.01;
  }

  const normalizedAge = ageMs / config.temporalWindowMs;
  return Math.exp(-config.temporalDecayRate * normalizedAge);
}

/** Calculate agreement weight from nearby values in the current cohort. */
export function calculateConsensusWeight(
  input: AudienceInput,
  allInputs: AudienceInput[],
  config: WeightingConfig,
): number {
  if (allInputs.length <= 1) return 1;

  let agreementCount = 0;
  for (const other of allInputs) {
    if (other.id === input.id) continue;
    if (Math.abs(other.value - input.value) <= config.clusterThreshold) {
      agreementCount += 1;
    }
  }

  return agreementCount / (allInputs.length - 1);
}

/** Calculate the combined scalar weight for one input. */
export function calculateWeight(
  input: AudienceInput,
  allInputs: AudienceInput[],
  stagePosition: { x: number; y: number },
  currentTime: number,
  config: WeightingConfig = DEFAULT_WEIGHTING_CONFIG,
): number {
  const spatial = calculateSpatialWeight(input.location, stagePosition, config);
  const temporal = calculateTemporalWeight(input.timestamp, currentTime, config);
  const consensus = calculateConsensusWeight(input, allInputs, config);
  const weight =
    config.spatialAlpha * spatial
    + config.temporalBeta * temporal
    + config.consensusGamma * consensus;

  return Math.max(0.001, Math.min(1, weight));
}

/**
 * Transform raw inputs into weighted inputs.
 *
 * `evaluationTime` is injectable so tests and benchmarks can evaluate exactly
 * the same temporal cohort across runs. Runtime callers may omit it.
 */
export function weightInputs(
  inputs: AudienceInput[],
  stagePosition: { x: number; y: number },
  config: WeightingConfig = DEFAULT_WEIGHTING_CONFIG,
  evaluationTime: number = Date.now(),
): WeightedInput[] {
  return inputs.map((input) => {
    const spatialWeight = calculateSpatialWeight(input.location, stagePosition, config);
    const temporalWeight = calculateTemporalWeight(input.timestamp, evaluationTime, config);
    const consensusWeight = calculateConsensusWeight(input, inputs, config);
    const weight =
      config.spatialAlpha * spatialWeight
      + config.temporalBeta * temporalWeight
      + config.consensusGamma * consensusWeight;

    return {
      ...input,
      weight: Math.max(0.001, Math.min(1, weight)),
      spatialWeight,
      temporalWeight,
      consensusWeight,
    };
  });
}

/** Calculate a weighted mean, using 0.5 as the empty/default value. */
export function weightedMean(inputs: WeightedInput[]): number {
  if (inputs.length === 0) return 0.5;

  let weightedSum = 0;
  let totalWeight = 0;
  for (const input of inputs) {
    weightedSum += input.value * input.weight;
    totalWeight += input.weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

/** Calculate weighted population standard deviation. */
export function standardDeviation(inputs: WeightedInput[]): number {
  if (inputs.length < 2) return 0;

  const mean = weightedMean(inputs);
  let sumSquaredDiff = 0;
  let totalWeight = 0;
  for (const input of inputs) {
    sumSquaredDiff += input.weight * ((input.value - mean) ** 2);
    totalWeight += input.weight;
  }

  return totalWeight > 0 ? Math.sqrt(sumSquaredDiff / totalWeight) : 0;
}

/** Remove observations whose weighted z-score exceeds the declared threshold. */
export function removeOutliers(
  inputs: WeightedInput[],
  threshold: number = 2.5,
): WeightedInput[] {
  if (inputs.length < 4) return inputs;

  const mean = weightedMean(inputs);
  const std = standardDeviation(inputs);
  if (std < 0.001) return inputs;

  return inputs.filter((input) => {
    const zScore = Math.abs((input.value - mean) / std);
    return zScore <= threshold;
  });
}

/** Apply first-order exponential smoothing. */
export function smoothValue(
  newValue: number,
  previousValue: number,
  smoothingFactor: number,
): number {
  return previousValue + smoothingFactor * (newValue - previousValue);
}

/** Identify contiguous value clusters and report simple dispersion properties. */
export function analyzeCluster(
  inputs: WeightedInput[],
  threshold: number = 0.15,
): ClusterAnalysis {
  if (inputs.length === 0) {
    return {
      clusters: [],
      dominantCluster: null,
      entropy: 0,
      bimodality: false,
    };
  }

  const sorted = [...inputs].sort((left, right) => left.value - right.value);
  const clusters: InputCluster[] = [];
  let currentCluster: WeightedInput[] = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const gap = sorted[index].value - sorted[index - 1].value;
    if (gap <= threshold) {
      currentCluster.push(sorted[index]);
    } else {
      clusters.push(createCluster(currentCluster));
      currentCluster = [sorted[index]];
    }
  }
  clusters.push(createCluster(currentCluster));

  const dominantCluster = clusters.reduce<InputCluster | null>(
    (current, cluster) => (
      cluster.density > (current?.density ?? 0) ? cluster : current
    ),
    null,
  );

  const totalWeight = inputs.reduce((sum, input) => sum + input.weight, 0);
  let entropy = 0;
  for (const cluster of clusters) {
    const probability = cluster.density / totalWeight;
    if (probability > 0) entropy -= probability * Math.log2(probability);
  }

  // Cluster order is value order, not density order. Determine modality from
  // the two densest clusters so a sparse edge cluster cannot hide two large
  // separated groups later in the value range.
  const densestClusters = [...clusters].sort(
    (left, right) => right.density - left.density,
  );
  const bimodality = densestClusters.length >= 2
    && densestClusters[0].density > totalWeight * 0.3
    && (densestClusters[1]?.density ?? 0) > totalWeight * 0.3;

  return { clusters, dominantCluster, entropy, bimodality };
}

function createCluster(members: WeightedInput[]): InputCluster {
  const centroid = members.reduce((sum, member) => sum + member.value, 0) / members.length;
  const density = members.reduce((sum, member) => sum + member.weight, 0);
  const coherence = 1 - (
    members.length > 1
      ? Math.max(...members.map((member) => Math.abs(member.value - centroid)))
      : 0
  );

  return { centroid, members, density, coherence };
}

/**
 * Compute one consensus result.
 *
 * `evaluationTime` controls both result time and temporal weighting. Injecting
 * it makes a cohort reproducible; omitting it preserves normal runtime behavior.
 */
export function computeConsensus(
  parameter: string,
  inputs: AudienceInput[],
  stagePosition: { x: number; y: number },
  config: WeightingConfig = DEFAULT_WEIGHTING_CONFIG,
  previousValue?: number,
  mode: ConsensusMode = ConsensusMode.WEIGHTED_AVERAGE,
  evaluationTime: number = Date.now(),
): ConsensusResult {
  if (inputs.length === 0) {
    return {
      parameter,
      value: previousValue ?? 0.5,
      confidence: 0,
      inputCount: 0,
      timestamp: evaluationTime,
      mode,
      rawMean: 0.5,
      weightedMean: 0.5,
      standardDeviation: 0,
      participationRate: 0,
    };
  }

  const weighted = weightInputs(inputs, stagePosition, config, evaluationTime);
  const filtered = removeOutliers(weighted, config.outlierThreshold);
  const rawMean = inputs.reduce((sum, input) => sum + input.value, 0) / inputs.length;
  const currentWeightedMean = weightedMean(filtered);
  const currentStandardDeviation = standardDeviation(filtered);

  let value: number;
  switch (mode) {
    case ConsensusMode.MEDIAN: {
      const sorted = [...filtered].sort((left, right) => left.value - right.value);
      value = sorted[Math.floor(sorted.length / 2)]?.value ?? 0.5;
      break;
    }
    case ConsensusMode.MAJORITY_VOTE: {
      const analysis = analyzeCluster(filtered);
      value = analysis.dominantCluster?.centroid ?? currentWeightedMean;
      break;
    }
    case ConsensusMode.WEIGHTED_AVERAGE:
    default:
      value = currentWeightedMean;
  }

  if (previousValue !== undefined) {
    value = smoothValue(value, previousValue, config.smoothingFactor);
  }

  const confidence = Math.max(0, 1 - currentStandardDeviation * 2);

  return {
    parameter,
    value,
    confidence,
    inputCount: inputs.length,
    timestamp: evaluationTime,
    mode,
    rawMean,
    weightedMean: currentWeightedMean,
    standardDeviation: currentStandardDeviation,
    participationRate: filtered.length / inputs.length,
  };
}

/** Apply a performer's declared override mode to one consensus value. */
export function applyOverride(
  consensusValue: number,
  override: PerformerOverride | null,
): number {
  if (!override) return consensusValue;

  switch (override.mode) {
    case 'absolute':
    case 'lock':
      return override.value;
    case 'blend': {
      const blend = override.blendFactor ?? 0.5;
      return consensusValue * (1 - blend) + override.value * blend;
    }
    default:
      return consensusValue;
  }
}

/** Report whether an override is present and unexpired at an explicit clock. */
export function isOverrideActive(
  override: PerformerOverride | null,
  evaluationTime: number = Date.now(),
): boolean {
  if (!override) return false;
  if (override.expiresAt === undefined) return true;
  return evaluationTime < override.expiresAt;
}
