import { afterEach, describe, expect, it, vi } from 'vitest';
import { dispatchWorkspaceCheck } from '../src/shared/utils/dispatch-workspace';

const API_URL = 'https://example.invalid/api';

describe('workspace dispatch HTTP acceptance', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([200, 202, 204])('accepts HTTP %i without requiring a JSON response', async (status) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));
    await expect(dispatchWorkspaceCheck(API_URL, 'sound-stage', request)).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledExactlyOnceWith(`${API_URL}/metasystem/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceName: 'sound-stage',
        title: 'Orchestrator Checkup',
        description: 'Routine consistency check triggered from Performance Dashboard.',
        priority: 'normal',
      }),
    });
  });

  it.each([400, 401, 403, 404, 409, 429, 500, 503])('rejects HTTP %i instead of announcing success', async (status) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));
    await expect(dispatchWorkspaceCheck(API_URL, 'sound-stage', request))
      .rejects.toThrow(`Dispatch failed (HTTP ${status})`);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('propagates network rejection without retrying a potentially accepted POST', async () => {
    const failure = new TypeError('Network unavailable');
    const request = vi.fn<typeof fetch>().mockRejectedValue(failure);
    await expect(dispatchWorkspaceCheck(API_URL, 'sound-stage', request)).rejects.toBe(failure);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each(['', ' ', '\t\n'])('rejects an empty workspace %j before making a request', async (name) => {
    const request = vi.fn<typeof fetch>();
    await expect(dispatchWorkspaceCheck(API_URL, name, request)).rejects.toThrow('A workspace name is required');
    expect(request).not.toHaveBeenCalled();
  });

  it.each(['file:///tmp', 'ftp://example.invalid', 'not-a-url'])('rejects invalid endpoint %s before making a request', async (endpoint) => {
    const request = vi.fn<typeof fetch>();
    await expect(dispatchWorkspaceCheck(endpoint, 'sound-stage', request)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it('normalizes trailing slashes while preserving a configured API prefix', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 202 }));
    await dispatchWorkspaceCheck(`${API_URL}///`, 'sound-stage', request);
    expect(request.mock.calls[0][0]).toBe(`${API_URL}/metasystem/dispatch`);
  });

  it('uses the browser fetch implementation when none is explicitly supplied', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', request);
    await dispatchWorkspaceCheck(API_URL, 'sound-stage');
    expect(request).toHaveBeenCalledTimes(1);
  });
});
