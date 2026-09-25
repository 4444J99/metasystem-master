/**
 * Parameter Aggregation for Omni-Dromenon-Engine
 *
 * Manages multi-parameter consensus computation and
 * coordinates aggregation across all active parameters.
 */

import {
  type AudienceInput,
  type ConsensusResult,
  type ConsensusSnapshot,
  type PerformerOverride,
  type WeightingConfig,
  type AggregationState,
  type ParameterDefinition,
  ConsensusMode,
  DEFAULT_WEIGHTING_CONFIG,
} from '../types/index.js';

import {
  computeConsensus,
  applyOverride,
  isOverrideActive,
} from './weighted-voting.js';

// =============================================================================
// AGGREGATION ENGINE
// =============================================================================

export interface AggregatorConfig {
  weighting: WeightingConfig;
  mode: ConsensusMode;
  stagePosition: { x: number; y: number };
  inputWindowMs: number; // How long to keep inputs
  snapshotIntervalMs: number;
  maxHistoryLength: number;
}

export const DEFAULT_AGGREGATOR_CONFIG: AggregatorConfig = {
  weighting: DEFAULT_WEIGHTING_CONFIG,
  mode: ConsensusMode.WEIGHTED_AVERAGE,
  stagePosition: { x: 50, y: 0 },
  inputWindowMs: 10000,
  snapshotIntervalMs: 1000,
  maxHistoryLength: 100,
};

export class ParameterAggregator {
  private config: AggregatorConfig;
  private states: Map<string, AggregationState>;
  private overrides: Map<string, PerformerOverride>;
  private parameters: Map<string, ParameterDefinition>;
  private sessionId: string;

  constructor(
    sessionId: string,
    parameters: ParameterDefinition[],
    config: Partial<AggregatorConfig> = {},
  ) {
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_AGGREGATOR_CONFIG, ...config };
    this.states = new Map();
    this.overrides = new Map();
    this.parameters = new Map(parameters.map((parameter) => [parameter.id, parameter]));

    // Initialize state for each parameter.
    for (const parameter of parameters) {
      this.states.set(parameter.id, {
        parameter: parameter.id,
        inputs: [],
        weightedInputs: [],
        currentConsensus: null,
        performerOverride: null,
        history: [],
        lastUpdated: Date.now(),
      });
    }
  }

  // ===========================================================================
  // INPUT HANDLING
  // ===========================================================================

  /** Add new audience input for this aggregator's session. */
  addInput(input: AudienceInput, evaluationTime: number = Date.now()): void {
    // An aggregator is session-scoped. Silently accepting another session's
    // input would contaminate both consensus and participant counts.
    if (input.sessionId !== this.sessionId) return;

    const state = this.states.get(input.parameter);
    if (!state) return;

    const parameter = this.parameters.get(input.parameter);
    if (!parameter?.audienceControllable) return;

    state.inputs.push(input);
    state.lastUpdated = evaluationTime;

    // Prune old inputs against the same clock used for this input operation.
    this.pruneInputs(state, evaluationTime);
  }

  /** Add multiple inputs at one shared evaluation time. */
  addInputs(inputs: AudienceInput[], evaluationTime: number = Date.now()): void {
    for (const input of inputs) {
      this.addInput(input, evaluationTime);
    }
  }

  /** Remove inputs older than the configured window. */
  private pruneInputs(
    state: AggregationState,
    evaluationTime: number = Date.now(),
  ): void {
    const cutoff = evaluationTime - this.config.inputWindowMs;
    state.inputs = state.inputs.filter((input) => input.timestamp > cutoff);
  }

  // ===========================================================================
  // OVERRIDE HANDLING
  // ===========================================================================

  /** Set performer override for a parameter. */
  setOverride(override: PerformerOverride): void {
    const parameter = this.parameters.get(override.parameter);
    if (!parameter?.performerControllable) return;

    this.overrides.set(override.parameter, override);

    const state = this.states.get(override.parameter);
    if (state) {
      state.performerOverride = override;
    }
  }

  /** Clear override for a parameter. */
  clearOverride(parameter: string): void {
    this.overrides.delete(parameter);

    const state = this.states.get(parameter);
    if (state) {
      state.performerOverride = null;
    }
  }

  /** Get the active override at an explicit evaluation time. */
  getOverride(
    parameter: string,
    evaluationTime: number = Date.now(),
  ): PerformerOverride | null {
    const override = this.overrides.get(parameter);
    if (!override) return null;

    if (isOverrideActive(override, evaluationTime)) {
      return override;
    }

    // Expiration changes state, not only the return value. Remove the stale
    // object from both the override map and the public aggregation state.
    this.clearOverride(parameter);
    return null;
  }

  // ===========================================================================
  // CONSENSUS COMPUTATION
  // ===========================================================================

  /** Compute consensus for a single parameter at one evaluation time. */
  computeParameter(
    parameter: string,
    evaluationTime: number = Date.now(),
  ): ConsensusResult | null {
    const state = this.states.get(parameter);
    if (!state) return null;

    // Prune and compute against the same clock.
    this.pruneInputs(state, evaluationTime);

    const previousValue = state.currentConsensus?.value;
    const consensus = computeConsensus(
      parameter,
      state.inputs,
      this.config.stagePosition,
      this.config.weighting,
      previousValue,
      this.config.mode,
      evaluationTime,
    );

    const override = this.getOverride(parameter, evaluationTime);
    if (override) {
      consensus.value = applyOverride(consensus.value, override);
    }

    state.currentConsensus = consensus;
    state.history.push(consensus);

    if (state.history.length > this.config.maxHistoryLength) {
      state.history = state.history.slice(-this.config.maxHistoryLength);
    }

    return consensus;
  }

  /** Compute consensus for all parameters at one shared evaluation time. */
  computeAll(
    evaluationTime: number = Date.now(),
  ): Map<string, ConsensusResult> {
    const results = new Map<string, ConsensusResult>();

    for (const parameter of this.parameters.keys()) {
      const result = this.computeParameter(parameter, evaluationTime);
      if (result) {
        results.set(parameter, result);
      }
    }

    return results;
  }

  // ===========================================================================
  // SNAPSHOT
  // ===========================================================================

  /** Create a snapshot whose pruning, results, counts, and timestamp share one clock. */
  createSnapshot(evaluationTime: number = Date.now()): ConsensusSnapshot {
    const results = this.computeAll(evaluationTime);

    const activeClients = new Set<string>();
    const cutoff = evaluationTime - this.config.inputWindowMs;

    for (const state of this.states.values()) {
      for (const input of state.inputs) {
        if (input.timestamp > cutoff) {
          activeClients.add(input.clientId);
        }
      }
    }

    return {
      sessionId: this.sessionId,
      timestamp: evaluationTime,
      results,
      totalParticipants: activeClients.size,
      activeParticipants: activeClients.size,
    };
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  /** Get current value for a parameter. */
  getValue(parameter: string): number {
    const state = this.states.get(parameter);
    if (!state?.currentConsensus) {
      const definition = this.parameters.get(parameter);
      return definition?.defaultValue ?? 0.5;
    }
    return state.currentConsensus.value;
  }

  /** Get all current values as a plain object. */
  getAllValues(): Record<string, number> {
    const values: Record<string, number> = {};
    for (const [parameter, state] of this.states) {
      values[parameter] = state.currentConsensus?.value
        ?? (this.parameters.get(parameter)?.defaultValue ?? 0.5);
    }
    return values;
  }

  /** Get state for a parameter. */
  getState(parameter: string): AggregationState | undefined {
    return this.states.get(parameter);
  }

  /** Get input count for a parameter. */
  getInputCount(parameter: string): number {
    return this.states.get(parameter)?.inputs.length ?? 0;
  }

  /** Get total input count across all parameters. */
  getTotalInputCount(): number {
    let count = 0;
    for (const state of this.states.values()) {
      count += state.inputs.length;
    }
    return count;
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /** Update configuration. */
  updateConfig(config: Partial<AggregatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Update stage position for spatial weighting. */
  setStagePosition(x: number, y: number): void {
    this.config.stagePosition = { x, y };
  }

  /** Reset all session state at one evaluation time. */
  reset(evaluationTime: number = Date.now()): void {
    for (const state of this.states.values()) {
      state.inputs = [];
      state.weightedInputs = [];
      state.currentConsensus = null;
      state.performerOverride = null;
      state.history = [];
      state.lastUpdated = evaluationTime;
    }
    this.overrides.clear();
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createAggregator(
  sessionId: string,
  parameters: ParameterDefinition[],
  config?: Partial<AggregatorConfig>,
): ParameterAggregator {
  return new ParameterAggregator(sessionId, parameters, config);
}
