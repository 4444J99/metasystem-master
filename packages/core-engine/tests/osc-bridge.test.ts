/**
 * OSC Bridge Tests for Omni-Dromenon-Engine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBus } from '../src/bus/parameter-bus.js';
import { createOSCBridge } from '../src/osc/osc-bridge.js';
import { ConsensusMode, type ConsensusResult } from '../src/types/index.js';

const oscMock = vi.hoisted(() => {
  class MockUDPPort {
    options: Record<string, unknown>;
    sent: unknown[] = [];
    handlers = new Map<string, Array<(...args: unknown[]) => void>>();
    open = vi.fn(() => {
      this.emit('ready');
    });
    close = vi.fn();
    send = vi.fn((packet: unknown) => {
      this.sent.push(packet);
    });

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }

    on(event: string, handler: (...args: unknown[]) => void): this {
      const handlers = this.handlers.get(event) ?? [];
      handlers.push(handler);
      this.handlers.set(event, handlers);
      return this;
    }

    emit(event: string, ...args: unknown[]): void {
      for (const handler of this.handlers.get(event) ?? []) {
        handler(...args);
      }
    }
  }

  const instances: MockUDPPort[] = [];
  const UDPPort = vi.fn(function MockUDPPortConstructor(
    this: unknown,
    options: Record<string, unknown>
  ) {
    const port = new MockUDPPort(options);
    instances.push(port);
    return port;
  });
  const timeTag = vi.fn((time: number) => ({ time }));

  return { instances, UDPPort, timeTag };
});

vi.mock('osc', () => ({
  default: {
    UDPPort: oscMock.UDPPort,
    timeTag: oscMock.timeTag,
  },
}));

function consensus(parameter: string, value: number): ConsensusResult {
  return {
    parameter,
    value,
    confidence: 0.9,
    inputCount: 4,
    timestamp: 123,
    mode: ConsensusMode.WEIGHTED_AVERAGE,
    rawMean: value,
    weightedMean: value,
    standardDeviation: 0.05,
    participationRate: 0.8,
  };
}

function latestPort() {
  return oscMock.instances.at(-1);
}

describe('OSCBridge', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    oscMock.instances.length = 0;
    oscMock.UDPPort.mockClear();
    oscMock.timeTag.mockClear();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('opens a configured UDP port and tracks connection state', async () => {
    const bridge = createOSCBridge({
      localPort: 9101,
      remoteHost: '127.0.0.2',
      remotePort: 9102,
      addressPrefix: '/test',
      enabled: true,
    });
    const connected = vi.fn();
    bridge.on('connected', connected);

    await bridge.connect();

    expect(oscMock.UDPPort).toHaveBeenCalledWith({
      localAddress: '0.0.0.0',
      localPort: 9101,
      remoteAddress: '127.0.0.2',
      remotePort: 9102,
      metadata: true,
    });
    expect(bridge.isConnected()).toBe(true);
    expect(connected).toHaveBeenCalledOnce();

    const port = latestPort();
    bridge.disconnect();

    expect(port?.close).toHaveBeenCalledOnce();
    expect(bridge.isConnected()).toBe(false);
  });

  it('does not create a UDP port when disabled', async () => {
    const bridge = createOSCBridge({ enabled: false });

    await bridge.connect();

    expect(oscMock.UDPPort).not.toHaveBeenCalled();
    expect(bridge.isConnected()).toBe(false);
  });

  it('sends parameter updates with the configured address prefix', async () => {
    const bridge = createOSCBridge({ addressPrefix: '/test' });

    await bridge.connect();
    bridge.sendParameter('mood', 0.75);

    const port = latestPort();
    expect(port?.send).toHaveBeenCalledWith({
      address: '/test/mood',
      args: [{ type: 'f', value: 0.75 }],
    });
    expect(bridge.getStats()).toEqual({ connected: true, messageCount: 1 });
  });

  it('does not send or count messages before connecting', () => {
    const bridge = createOSCBridge({ addressPrefix: '/test' });

    bridge.sendParameter('mood', 0.75);

    expect(latestPort()).toBeUndefined();
    expect(bridge.getStats()).toEqual({ connected: false, messageCount: 0 });
  });

  it('formats OSC bundles with typed arguments and timetags', async () => {
    const bridge = createOSCBridge({ addressPrefix: '/test' });
    const blob = Buffer.from([1, 2, 3]);

    await bridge.connect();
    bridge.sendBundle(
      [
        {
          address: '/test/mood',
          args: [0.6, 'bright', true, false, blob],
        },
      ],
      456
    );

    expect(oscMock.timeTag).toHaveBeenCalledWith(456);
    expect(latestPort()?.send).toHaveBeenCalledWith({
      timeTag: { time: 456 },
      packets: [
        {
          address: '/test/mood',
          args: [
            { type: 'f', value: 0.6 },
            { type: 's', value: 'bright' },
            { type: 'T' },
            { type: 'F' },
            { type: 'b', value: blob },
          ],
        },
      ],
    });
    expect(bridge.getStats().messageCount).toBe(1);
  });

  it('forwards bus consensus updates and snapshots to OSC', async () => {
    const bus = createBus();
    const bridge = createOSCBridge({ addressPrefix: '/test' });

    bridge.attachToBus(bus);
    await bridge.connect();
    bus.publishConsensus(consensus('tempo', 0.42));
    bus.publishSnapshot({
      sessionId: 'session-1',
      timestamp: 124,
      totalParticipants: 5,
      activeParticipants: 4,
      results: new Map([
        ['mood', consensus('mood', 0.7)],
        ['density', consensus('density', 0.2)],
      ]),
    });

    const port = latestPort();
    expect(port?.send).toHaveBeenNthCalledWith(1, {
      address: '/test/tempo',
      args: [{ type: 'f', value: 0.42 }],
    });
    expect(port?.send).toHaveBeenNthCalledWith(2, {
      timeTag: { time: 0 },
      packets: [
        {
          address: '/test/mood',
          args: [{ type: 'f', value: 0.7 }],
        },
        {
          address: '/test/density',
          args: [{ type: 'f', value: 0.2 }],
        },
      ],
    });
    expect(bridge.getStats().messageCount).toBe(3);
  });

  it('emits parsed incoming messages and answers ping', async () => {
    const bridge = createOSCBridge({ addressPrefix: '/test' });
    const received = vi.fn();
    bridge.on('message', received);

    await bridge.connect();
    const port = latestPort();
    port?.emit('message', {
      address: '/test/tempo',
      args: [{ type: 'f', value: 0.33 }],
    });
    port?.emit('message', {
      address: '/ignored/tempo',
      args: [{ type: 'f', value: 0.99 }],
    });
    port?.emit('message', {
      address: '/test/ping',
      args: [],
    });

    expect(received).toHaveBeenCalledTimes(2);
    expect(received).toHaveBeenNthCalledWith(1, {
      address: '/test/tempo',
      parameter: 'tempo',
      args: [0.33],
    });
    expect(received).toHaveBeenNthCalledWith(2, {
      address: '/test/ping',
      parameter: 'ping',
      args: [],
    });
    expect(port?.send).toHaveBeenCalledWith({
      address: '/test/pong',
      args: [{ type: 'i', value: expect.any(Number) }],
    });
  });
});
