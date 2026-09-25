# Core Engine

The computational core of Omni-Dromenon: a TypeScript server and consensus library for aggregating audience inputs and routing performance parameters while preserving performer override authority.

## Evidence status

**Current state:** proof-of-concept code under reproducibility repair. The repository now defines strict typecheck, deterministic functional tests, and a seeded in-process benchmark, but no successful GitHub Actions runner execution or benchmark artifact has yet been recovered for this branch.

**Current admissible claim:** the source contains inspectable consensus and override implementations plus test and benchmark entrypoints. It does not yet establish production readiness, audience-device latency, WebSocket latency, throughput, delivery rate, concurrent-user capacity, rehearsal behavior, or live-performance outcomes.

**Next gate:** obtain a complete strict workflow run, preserve exact compiler/test output and the JSON benchmark artifact, then repeat the benchmark in declared environments. No latency threshold is asserted by the baseline.

See [`../../docs/reproducibility/core-engine-evidence-status.md`](../../docs/reproducibility/core-engine-evidence-status.md) for the claim register and evidence boundary.

## Architecture

```text
core-engine/
├── src/
│   ├── benchmarks/    -> Seeded in-process consensus benchmark
│   ├── consensus/     -> Weighted voting and parameter aggregation
│   ├── bus/           -> Parameter routing and pub/sub
│   ├── osc/           -> OSC bridge for external synthesizers
│   ├── server/        -> Express and Socket.IO
│   ├── types/         -> Shared TypeScript interfaces
│   └── middleware/    -> Auth, rate limiting, and validation
├── tests/             -> Deterministic functional tests
└── docker/            -> Container scaffolding
```

## Reproducibility commands

Run these from the repository root after installing the locked workspace dependencies:

```bash
pnpm install --frozen-lockfile
pnpm --filter @omni-dromenon/core-engine typecheck
pnpm --filter @omni-dromenon/core-engine test
pnpm --filter @omni-dromenon/core-engine test:bench -- --output benchmark-results/consensus-baseline.json
```

The benchmark measures only in-process `computeConsensus` calls over deterministic cohorts of 10, 100, 250, 500, and 1,000 inputs. It excludes network transport, serialization, Socket.IO, Redis, OSC, rendering, audience devices, rehearsal conditions, and live-performance behavior.

## Development commands

```bash
pnpm --filter @omni-dromenon/core-engine dev
pnpm --filter @omni-dromenon/core-engine build
pnpm --filter @omni-dromenon/core-engine start
```

## Core concepts

**Parameter bus:** event-driven routing of performance parameter updates.

**Weighted consensus:** aggregation using declared spatial, temporal, and agreement weights.

**Performer override:** explicit `absolute`, `blend`, and `lock` modes that permit performer intervention in computed output.

These names describe implemented interfaces and algorithms; they do not by themselves establish usability, security, artistic success, or deployment quality.

## Configuration

| Variable | Default | Description |
|---|---:|---|
| `PORT` | `3000` | Server port |
| `REDIS_URL` | `localhost:6379` | Session-state store locator |
| `OSC_OUT_PORT` | `57121` | OSC output port |
| `CONSENSUS_WINDOW_MS` | `1000` | Voting-window duration |

## License

MIT © Anthony Padavano
