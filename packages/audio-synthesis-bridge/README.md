# Audio synthesis bridge — recovered prototype

The monorepo package now contains the existing in-process implementation and
three substantive test suites recovered from `organvm/audio-synthesis-bridge`
(repository ID `1110990770`) at commit
`da86e0b8e6a7e428385ad5a9e63c6f31ea5cf2f8`.

Recovered files: `src/index.ts`, `src/osc.ts`, `src/webaudio.ts`,
`tests/bridge.test.ts`, `tests/osc.test.ts`, `tests/webaudio.test.ts`, and
`tsconfig.json`. Their original Git blob identities were verified before
integration. The original 18 Vitest behavior cases are preserved unchanged.
Integration makes type-only exports explicit, enables isolated-module checking,
adds the declaration entrypoint, uses noninteractive tests, and corrects comments
that could imply actual sound generation. The historical empty nested source
paths are retained; the public library entrypoint is `src/index.ts`.

## Execute from the monorepo root

```sh
pnpm install --frozen-lockfile
pnpm --filter @omni-dromenon/audio-synthesis-bridge typecheck
pnpm --filter @omni-dromenon/audio-synthesis-bridge build
pnpm --filter @omni-dromenon/audio-synthesis-bridge test
```

Use the root `.nvmrc` and pinned `packageManager`. A successful build must emit
`dist/index.js` and `dist/index.d.ts`; it is no longer an empty-source build.

## Supported scope

`OscReceiver` parses the legacy prototype string format, dispatches messages
by exact address, and tracks an in-memory running flag. `WebAudioEngine` and
`SynthVoice` allocate, update, count, and release in-memory voice state.

This is **not** a standards-compliant OSC binary codec, UDP/TCP listener,
browser WebAudio graph, or proof of audible output. The inherited numeric parser
is permissive: it uses `parseFloat` and coerces invalid fields to zero; do not
route untrusted inputs or real hardware through it without a separately tested
validation/transport implementation. `start()` and `noteOn()` change state only.
No latency, delivery, hardware, browser, or live-performance claim follows from
these unit tests. Full transport and synthesis remain separate implementation
work, not acceptance that can be obtained by declaring the placeholder files done.
