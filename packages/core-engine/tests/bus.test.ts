import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { BusEvent, createBus, type ParameterBus } from '../src/bus/parameter-bus.js';
import {
  createAudienceInputsHandler,
  type AudienceInputsHandler,
} from '../src/bus/audience-inputs.js';
import {
  createPerformerSubscriptions,
  type PerformerSubscriptions,
} from '../src/bus/performer-subscriptions.js';
import {
  ConsensusMode,
  type AudienceInput,
  type ConsensusResult,
  type PerformerOverride,
} from '../src/types/index.js';

const NOW = 1_800_000_000_000;

function result(): ConsensusResult {
  return {
    parameter: 'mood',
    value: 0.6,
    confidence: 0.9,
    inputCount: 10,
    timestamp: NOW,
    mode: ConsensusMode.WEIGHTED_AVERAGE,
    rawMean: 0.6,
    weightedMean: 0.6,
    standardDeviation: 0.1,
    participationRate: 1,
  };
}

function rawInput(index = 0): AudienceInput {
  return {
    id: `input-${index}`,
    clientId: `client-${index}`,
    sessionId: 'session',
    timestamp: NOW,
    parameter: 'mood',
    value: index / 10,
  };
}

describe('ParameterBus', () => {
  let bus: ParameterBus;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    bus = createBus();
  });

  afterEach(() => {
    bus.dispose();
    vi.useRealTimers();
  });

  it('publishes typed input, consensus, and override payloads', () => {
    const inputHandler = vi.fn();
    const consensusHandler = vi.fn();
    const overrideHandler = vi.fn();
    bus.subscribe(BusEvent.AUDIENCE_INPUT, inputHandler);
    bus.subscribe(BusEvent.CONSENSUS_UPDATE, consensusHandler);
    bus.subscribe(BusEvent.PERFORMER_OVERRIDE, overrideHandler);

    const input = rawInput();
    const consensus = result();
    const override: PerformerOverride = {
      performerId: 'performer-1',
      parameter: 'mood',
      value: 0.8,
      mode: 'absolute',
    };

    bus.publishInput(input);
    bus.publishConsensus(consensus);
    bus.publishOverride(override);

    expect(inputHandler).toHaveBeenCalledWith(input);
    expect(consensusHandler).toHaveBeenCalledWith(consensus);
    expect(overrideHandler).toHaveBeenCalledWith(override);
  });

  it('supports unsubscribe, one-shot subscriptions, and disposal', () => {
    const inputHandler = vi.fn();
    const startHandler = vi.fn();
    const warningHandler = vi.fn();
    const unsubscribe = bus.subscribe(BusEvent.AUDIENCE_INPUT, inputHandler);
    bus.subscribeOnce(BusEvent.SESSION_START, startHandler);
    bus.subscribe(BusEvent.WARNING, warningHandler);

    unsubscribe();
    bus.publishInput(rawInput());
    bus.publish(BusEvent.SESSION_START, { sessionId: 'session' });
    bus.publish(BusEvent.SESSION_START, { sessionId: 'session' });
    bus.dispose();
    bus.publish(BusEvent.WARNING, { code: 'test', message: 'test' });

    expect(inputHandler).not.toHaveBeenCalled();
    expect(startHandler).toHaveBeenCalledTimes(1);
    expect(warningHandler).not.toHaveBeenCalled();
  });

  it('collects input rates over the scheduled one-second window', () => {
    for (let index = 0; index < 10; index += 1) {
      bus.publishInput(rawInput(index));
    }

    vi.advanceTimersByTime(1_000);

    expect(bus.getStats().inputsPerSecond).toBeCloseTo(10, 8);
  });
});

describe('AudienceInputsHandler', () => {
  let bus: ParameterBus;
  let handler: AudienceInputsHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    bus = createBus();
    handler = createAudienceInputsHandler(
      bus,
      'test-session',
      ['mood', 'tempo', 'intensity'],
    );
  });

  afterEach(() => {
    handler.destroy();
    bus.dispose();
    vi.useRealTimers();
  });

  it('accepts valid input and rejects invalid parameters and values', () => {
    expect(handler.handleInput('client-1', 'mood', 0.5).accepted).toBe(true);
    expect(handler.handleInput('client-2', 'invalid', 0.5).reason).toBe('invalid_parameter');
    expect(handler.handleInput('client-3', 'mood', -0.1).reason).toBe('invalid_value');
    expect(handler.handleInput('client-4', 'mood', 1.1).reason).toBe('invalid_value');
    expect(handler.handleInput('client-5', 'mood', Number.NaN).reason).toBe('invalid_value');
  });

  it('rate-limits rapid input and accepts again at the boundary', () => {
    expect(handler.handleInput('client-1', 'mood', 0.5).accepted).toBe(true);
    expect(handler.handleInput('client-1', 'mood', 0.6).reason).toBe('rate_limited');

    vi.advanceTimersByTime(100);

    expect(handler.handleInput('client-1', 'mood', 0.6).accepted).toBe(true);
  });

  it('publishes one buffered batch at the configured interval', () => {
    const batchHandler = vi.fn();
    bus.subscribe(BusEvent.AUDIENCE_INPUT_BATCH, batchHandler);
    handler.handleInput('client-1', 'mood', 0.5);

    vi.advanceTimersByTime(50);

    expect(batchHandler).toHaveBeenCalledTimes(1);
    expect(batchHandler.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('tracks location, removal, blocking, and exact unblock expiry', () => {
    handler.handleInput('client-1', 'mood', 0.5);
    handler.updateClientLocation('client-1', { x: 50, y: 30 });
    expect(handler.getClientState('client-1')?.location).toEqual({ x: 50, y: 30 });

    handler.blockClient('client-1', 1_000);
    expect(handler.handleInput('client-1', 'mood', 0.6).reason).toBe('client_blocked');
    vi.advanceTimersByTime(1_000);
    expect(handler.handleInput('client-1', 'mood', 0.6).accepted).toBe(true);

    handler.removeClient('client-1');
    expect(handler.getClientState('client-1')).toBeUndefined();
  });

  it('counts distinct active clients without wall-clock sleeps', () => {
    handler.handleInput('client-1', 'mood', 0.5);
    handler.handleInput('client-2', 'tempo', 0.6);

    expect(handler.getActiveClientCount()).toBe(2);
  });
});

describe('PerformerSubscriptions', () => {
  let bus: ParameterBus;
  let subscriptions: PerformerSubscriptions;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    bus = createBus();
    subscriptions = createPerformerSubscriptions(bus, 'test-session');
  });

  afterEach(() => {
    subscriptions.destroy();
    bus.dispose();
    vi.useRealTimers();
  });

  function registerAuthenticated(id = 'performer-1'): void {
    subscriptions.registerPerformer(id, id, undefined, NOW);
    subscriptions.setAuthenticated(id, true, NOW);
  }

  it('accepts only the configured prototype secret', () => {
    expect(subscriptions.authenticate('performer-1', 'dev-secret-change-me')).toBe(true);
    expect(subscriptions.authenticate('performer-1', 'wrong-secret')).toBe(false);
  });

  it('requires authentication and validates override fields', () => {
    subscriptions.registerPerformer('performer-1', 'Performer', undefined, NOW);
    const base = {
      performerId: 'performer-1',
      parameter: 'mood',
      mode: 'absolute' as const,
    };

    expect(subscriptions.requestOverride({ ...base, value: 0.5 }, NOW).reason)
      .toBe('not_authenticated');
    subscriptions.setAuthenticated('performer-1', true, NOW);
    expect(subscriptions.requestOverride({ ...base, value: Number.NaN }, NOW).reason)
      .toBe('invalid_value');
    expect(subscriptions.requestOverride({
      ...base,
      mode: 'blend',
      value: 0.5,
      blendFactor: 1.5,
    }, NOW).reason).toBe('invalid_blend_factor');
    expect(subscriptions.requestOverride({ ...base, value: 0.5, durationMs: 0 }, NOW).reason)
      .toBe('invalid_duration');
  });

  it('stores, clears, and expires overrides at the exact boundary', () => {
    registerAuthenticated();
    const request = {
      performerId: 'performer-1',
      parameter: 'mood',
      value: 0.8,
      mode: 'absolute' as const,
      durationMs: 100,
    };

    expect(subscriptions.requestOverride(request, NOW).success).toBe(true);
    expect(subscriptions.getOverride('mood', NOW + 99)).not.toBeNull();
    expect(subscriptions.getOverride('mood', NOW + 100)).toBeNull();
    expect(subscriptions.getPerformer('performer-1')?.activeOverrides.has('mood')).toBe(false);

    expect(subscriptions.requestOverride({ ...request, durationMs: undefined }, NOW).success)
      .toBe(true);
    expect(subscriptions.clearOverride('performer-1', 'mood')).toBe(true);
    expect(subscriptions.getOverride('mood', NOW)).toBeNull();
  });

  it('transfers override ownership without leaving a stale owner index', () => {
    registerAuthenticated('performer-1');
    registerAuthenticated('performer-2');
    subscriptions.requestOverride({
      performerId: 'performer-1',
      parameter: 'mood',
      value: 0.4,
      mode: 'absolute',
    }, NOW);
    subscriptions.requestOverride({
      performerId: 'performer-2',
      parameter: 'mood',
      value: 0.8,
      mode: 'absolute',
    }, NOW);

    expect(subscriptions.getPerformer('performer-1')?.activeOverrides.has('mood')).toBe(false);
    expect(subscriptions.getPerformer('performer-2')?.activeOverrides.has('mood')).toBe(true);
    expect(subscriptions.getOverride('mood', NOW)?.performerId).toBe('performer-2');
  });

  it('removes overrides even when their owner was deauthenticated', () => {
    registerAuthenticated();
    subscriptions.requestOverride({
      performerId: 'performer-1',
      parameter: 'mood',
      value: 0.8,
      mode: 'absolute',
    }, NOW);
    subscriptions.setAuthenticated('performer-1', false, NOW);

    subscriptions.removePerformer('performer-1');

    expect(subscriptions.getPerformer('performer-1')).toBeUndefined();
    expect(subscriptions.getOverride('mood', NOW)).toBeNull();
  });
});
