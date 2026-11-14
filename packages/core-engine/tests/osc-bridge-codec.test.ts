import { afterEach, describe, expect, it, vi } from 'vitest';
import osc from 'osc';
import { OSCBridge } from '../src/osc/osc-bridge.js';

afterEach(() => vi.restoreAllMocks());

describe('OSC metadata decoding at the bridge boundary', () => {
  it.each([
    ['single argument', [{ type: 'f', value: 0.5 }], [0.5]],
    ['no arguments', [], []],
    ['multiple arguments', [{ type: 'f', value: 0.5 }, { type: 's', value: 'synthetic' }], [0.5, 'synthetic']],
  ])('%s', async (_name, arguments_, expected) => {
    let port: osc.UDPPort | undefined;
    // Preserve the real constructor, codec and event path; only socket opening
    // is replaced. This is an in-process codec/bridge test, not a UDP test.
    vi.spyOn(osc.UDPPort.prototype, 'open').mockImplementation(function (this: osc.UDPPort) {
      port = this;
      this.emit('ready');
    });
    const bridge = new OSCBridge({ enabled: true, addressPrefix: '/omni' });
    const received = vi.fn();
    bridge.on('message', received);
    await bridge.connect();
    const bytes = osc.writeMessage({ address: '/omni/intensity', args: arguments_ }, { metadata: true });
    const decoded = osc.readMessage(bytes, { metadata: true, unpackSingleArgs: true });
    port!.emit('message', decoded);
    expect(received).toHaveBeenCalledWith({ address: '/omni/intensity', parameter: 'intensity', args: expected });
  });
});
