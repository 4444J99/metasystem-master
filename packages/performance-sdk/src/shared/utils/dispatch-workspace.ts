/**
 * Request a workspace check, resolving only after an HTTP-success response.
 * The supplied request function makes failures testable without contacting a
 * deployment. A successful HTTP response is acceptance, not job completion.
 */
export async function dispatchWorkspaceCheck(
  apiUrl: string,
  workspaceName: string,
  request: typeof fetch = globalThis.fetch,
): Promise<void> {
  if (typeof workspaceName !== 'string' || workspaceName.trim().length === 0) {
    throw new TypeError('A workspace name is required');
  }
  const endpoint = new URL(`${apiUrl.replace(/\/+$/, '')}/metasystem/dispatch`);
  if (!['http:', 'https:'].includes(endpoint.protocol)) {
    throw new TypeError('The dispatch endpoint must use HTTP or HTTPS');
  }
  const response = await request(endpoint.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceName,
      title: 'Orchestrator Checkup',
      description: 'Routine consistency check triggered from Performance Dashboard.',
      priority: 'normal',
    }),
  });
  if (!response.ok) {
    throw new Error(`Dispatch failed (HTTP ${response.status})`);
  }
}
