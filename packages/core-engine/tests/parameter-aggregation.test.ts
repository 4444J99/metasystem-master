import { describe, expect, it } from 'vitest';
import { ParameterAggregator } from '../src/consensus/parameter-aggregation.js';
import {
  ParameterCategory,
  type AudienceInput,
  type ParameterDefinition,
  type PerformerOverride,
} from '../src/types/index.js';

const NOW = 1_800_000_000_000;
const SESSION_ID = 'session-a';

const PARAMETER: ParameterDefinition = {
  id: 'intensity',
  name: 'Intensity',
  category: ParameterCategory.INTENSITY,
  description: 'Test intensity parameter',
  min: 0,
  max: 1,
  defaultValue: 0.3,
  audienceControllable: true,
  performerControllable: true,
  smoothingEnabled: true,
};

function input(
  index: number,
  value: number,
  options: Partial<AudienceInput> = {},
): AudienceInput {
  return {
    id: `input-${index}`,
    clientId: `client-${index}`,
    sessionId: SESSION_ID,
    timestamp: NOW - index,
    parameter: PARAMETER.id,
    value,
    location: { x: 50, y: 0 },
    ...options,
  };
}

function override(options: Partial<PerformerOverride> = {}): PerformerOverride {
  return {
    performerId: 'performer-1',
    parameter: PARAMETER.id,
    value: 0.9,
    mode: 'absolute',
    ...options,
  };
}

describe('ParameterAggregator session isolation', () => {
  it('rejects input belonging to another session', () => {
    const aggregator = new ParameterAggregator(SESSION_ID, [PARAMETER]);

    aggregator.addInputs([
      input(0, 0.25),
      input(1, 0.75, { sessionId: 'session-b' }),
    ], NOW);

    expect(aggregator.getInputCount(PARAMETER.id)).toBe(1);
    expect(aggregator.getState(PARAMETER.id)?.inputs[0]?.sessionId).toBe(SESSION_ID);
  });

  it('prunes inputs at the configured window boundary using the supplied clock', () => {
    const aggregator = new ParameterAggregator(SESSION_ID, [PARAMETER], {
      inputWindowMs: 10_000,
    });

    aggregator.addInput(input(0, 0.5, { timestamp: NOW - 10_000 }), NOW);

    expect(aggregator.getInputCount(PARAMETER.id)).toBe(0);
  });
});

describe('ParameterAggregator deterministic snapshots', () => {
  it('uses one evaluation time for pruning, results, and snapshot metadata', () => {
    const aggregator = new ParameterAggregator(SESSION_ID, [PARAMETER]);
    aggregator.addInputs([
      input(0, 0.25),
      input(1, 0.75),
    ], NOW);

    const snapshot = aggregator.createSnapshot(NOW);
    const result = snapshot.results.get(PARAMETER.id);

    expect(snapshot.timestamp).toBe(NOW);
    expect(snapshot.sessionId).toBe(SESSION_ID);
    expect(snapshot.activeParticipants).toBe(2);
    expect(snapshot.totalParticipants).toBe(2);
    expect(result?.timestamp).toBe(NOW);
    expect(result?.inputCount).toBe(2);
  });
});

describe('ParameterAggregator override lifecycle', () => {
  it('applies an override before expiry and clears it at expiry', () => {
    const aggregator = new ParameterAggregator(SESSION_ID, [PARAMETER]);
    aggregator.addInput(input(0, 0.1), NOW);
    aggregator.setOverride(override({ expiresAt: NOW + 1 }));

    expect(aggregator.computeParameter(PARAMETER.id, NOW)?.value).toBe(0.9);
    expect(aggregator.getState(PARAMETER.id)?.performerOverride).not.toBeNull();

    expect(aggregator.getOverride(PARAMETER.id, NOW + 1)).toBeNull();
    expect(aggregator.getState(PARAMETER.id)?.performerOverride).toBeNull();
  });

  it('clears both override storage locations during reset', () => {
    const aggregator = new ParameterAggregator(SESSION_ID, [PARAMETER]);
    aggregator.setOverride(override());

    aggregator.reset(NOW);

    expect(aggregator.getOverride(PARAMETER.id, NOW)).toBeNull();
    expect(aggregator.getState(PARAMETER.id)?.performerOverride).toBeNull();
    expect(aggregator.getState(PARAMETER.id)?.lastUpdated).toBe(NOW);
  });
});
