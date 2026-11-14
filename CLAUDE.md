# CLAUDE.md

This file provides repository-specific guidance to coding agents working in `metasystem-master`.

## Read first

1. If `.conductor/active-handoff.md` exists, read and obey it before editing.
2. Read [`docs/reproducibility/core-engine-evidence-status.md`](docs/reproducibility/core-engine-evidence-status.md) before repeating any performance, capacity, deployment, rehearsal, or live-performance claim.
3. Treat active source, design documents, grant drafts, deployment scaffolding, and historical cold storage as different evidence classes.
4. Do not convert source code, a passing unit test, a benchmark, a deployment file, or a portfolio page into evidence for a broader claim.

## Project overview

Omni-Dromenon is a research and artistic software system for audience-participatory performance. The repository contains a TypeScript core engine, interface packages, examples, infrastructure scaffolding, and extensive documentation. Its central design is weighted audience aggregation with explicit performer override authority.

**Current evidence state:** proof-of-concept under reproducibility and claim repair. The strict core workflow has not yet produced runner step logs or a JSON benchmark artifact for the current repair branch. No latency, connection-capacity, delivery, error-rate, deployment, rehearsal, live-performance, production-readiness, usability, or artistic-outcome result is currently established.

## Repository structure

```text
packages/
  core-engine/               consensus, bus, server, OSC, types
  performance-sdk/           performer and audience interfaces
  client-sdk/                client integration
  audio-synthesis-bridge/    audio and OSC paths
  orchestrate/               separate Python orchestration package

examples/
  generative-music/
  generative-visual/
  choreographic-interface/
  theatre-dialogue/

infra/                       deployment scaffolding
docs/                        active docs, design records, proposals, archive
```

Directory presence does not establish build, deployment, or operation.

## Core evidence commands

Run from the repository root with the locked dependency graph available:

```bash
pnpm install --frozen-lockfile
pnpm --filter @omni-dromenon/core-engine typecheck
pnpm --filter @omni-dromenon/core-engine test
pnpm --filter @omni-dromenon/core-engine test:bench -- \
  --output benchmark-results/consensus-baseline.json
```

The benchmark is implemented at `packages/core-engine/src/benchmarks/consensus-bench.ts`. It measures only in-process `computeConsensus` calls, asserts no threshold, and excludes network, Socket.IO, Redis, OSC, rendering, devices, delivery, concurrency, rehearsal, and live-performance behavior.

## Core architecture

```text
Audience input -> parameter bus -> weighted consensus -> performer override -> outputs
```

Relevant source:

- `packages/core-engine/src/consensus/weighted-voting.ts`
- `packages/core-engine/src/consensus/parameter-aggregation.ts`
- `packages/core-engine/src/bus/`
- `packages/core-engine/src/server.ts`
- `packages/core-engine/src/osc/`
- `packages/core-engine/src/types/`
- `packages/core-engine/tests/`

### Performer override modes

- `absolute`: replace the consensus value;
- `blend`: combine performer and audience values;
- `lock`: hold the performer-selected value.

These are implemented interface semantics. Their usability, fairness, and artistic adequacy require separate evaluation.

## Correctness and reproducibility rules

- Supply one explicit evaluation clock in deterministic tests and benchmarks.
- Keep unit tests deterministic; do not use wall-clock latency as a unit-test pass/fail assertion.
- Preserve negative results and counterexamples.
- Runtime schemas and mathematical preconditions are not interchangeable; direct TypeScript callers can bypass validation.
- The current agreement calculation is pairwise and gives whole-call consensus computation `Theta(n^2)` time.
- A future numerical benchmark result must be named as in-process consensus compute time in its exact recorded environment.
- Do not call an example "validated" because it starts locally.

## Performance targets

Historical documents contain targets such as low WebSocket latency, low consensus compute time, bounded memory, and 1,000-client capacity. These are **unvalidated design targets**, not achieved results.

Before reinstating a number as a result, require:

1. exact source revision and lock state;
2. declared hardware, runtime, network, and workload;
3. preserved raw and summary artifacts;
4. repeated runs including failures and slow runs;
5. scope-specific wording;
6. a distinction among in-process computation, end-to-end networking, deployment, rehearsal, and live performance.

## Documentation states

- `docs/reproducibility/`: current evidence and claim controls.
- active technical docs: must match the exact implementation or identify themselves as proposals.
- `docs/business/GRANT_MATERIALS/`: proposal material, not proof that described events occurred.
- `docs/reference/omnidramanon-cold-storage/`: historical records; preserve them, but never inherit their claims as current evidence.

## Coding conventions

- TypeScript: strict mode, two-space indentation, semicolons.
- Server modules: kebab-case filenames.
- React components: PascalCase.
- Package scope: `@omni-dromenon/*`.
- Node requirement declared by the core package: `>=18.0.0`.
- Keep changes narrow and evidence-linked.

## Completion discipline

At the end of a code-changing session:

1. record the exact head;
2. run every available deterministic command;
3. preserve exact outputs rather than paraphrasing them;
4. state what could not execute and why;
5. update the evidence register when a claim changes state;
6. leave the PR draft when an execution or evidence gate remains open.

<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** ORGAN-II (Art) | **Tier:** flagship | **Status:** GRADUATED
**Org:** `organvm-ii-poiesis` | **Repo:** `metasystem-master`

### Edges
- **Produces** → `unspecified`: creative-artifact
- **Consumes** ← `ORGAN-I`: theory-artifact

### Siblings in Art
`core-engine`, `performance-sdk`, `example-generative-music`, `example-choreographic-interface`, `showcase-portfolio`, `archive-past-works`, `case-studies-methodology`, `learning-resources`, `example-generative-visual`, `example-interactive-installation`, `example-ai-collaboration`, `docs`, `a-mavs-olevm`, `a-i-council--coliseum`, `.github` ... and 16 more

### Governance
- Consumes Theory (I) concepts, produces artifacts for Commerce (III).

*Last synced: 2026-04-14T21:31:50Z*

## Active Handoff Protocol

If `.conductor/active-handoff.md` exists, **READ IT FIRST** before doing any work.
It contains constraints, locked files, conventions, and completed work from the
originating agent. You MUST honor all constraints listed there.

If the handoff says "CROSS-VERIFICATION REQUIRED", your self-assessment will
NOT be trusted. A different agent will verify your output against these constraints.

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only


## System Library

Plans: 269 indexed | Chains: 5 available | SOPs: 121 active
Discover: `organvm plans search <query>` | `organvm chains list` | `organvm sop lifecycle`
Library: `meta-organvm/praxis-perpetua/library/`


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | atomic-clock | The Atomic Clock |
| system | any | execution-sequence | Execution Sequence |
| system | any | multi-agent-dispatch | Multi-Agent Dispatch |
| system | any | session-handoff-avalanche | Session Handoff Avalanche |
| system | any | system-loops | System Loops |
| system | any | prompting-standards | Prompting Standards |
| system | any | research-standards-bibliography | APPENDIX: Research Standards Bibliography |
| system | any | phase-closing-and-forward-plan | METADOC: Phase-Closing Commemoration & Forward Attack Plan |
| system | any | research-standards | METADOC: Architectural Typology & Research Standards |
| system | any | sop-ecosystem | METADOC: SOP Ecosystem — Taxonomy, Inventory & Coverage |
| system | any | autonomous-content-syndication | SOP: Autonomous Content Syndication (The Broadcast Protocol) |
| system | any | autopoietic-systems-diagnostics | SOP: Autopoietic Systems Diagnostics (The Mirror of Eternity) |
| system | any | background-task-resilience | background-task-resilience |
| system | any | cicd-resilience-and-recovery | SOP: CI/CD Pipeline Resilience & Recovery |
| system | any | community-event-facilitation | SOP: Community Event Facilitation (The Dialectic Crucible) |
| system | any | context-window-conservation | context-window-conservation |
| system | any | conversation-to-content-pipeline | SOP — Conversation-to-Content Pipeline |
| system | any | cross-agent-handoff | SOP: Cross-Agent Session Handoff |
| system | any | cross-channel-publishing-metrics | SOP: Cross-Channel Publishing Metrics (The Echo Protocol) |
| system | any | data-migration-and-backup | SOP: Data Migration and Backup Protocol (The Memory Vault) |
| system | any | document-audit-feature-extraction | SOP: Document Audit & Feature Extraction |
| system | any | dynamic-lens-assembly | SOP: Dynamic Lens Assembly |
| system | any | essay-publishing-and-distribution | SOP: Essay Publishing & Distribution |
| system | any | formal-methods-applied-protocols | SOP: Formal Methods Applied Protocols |
| system | any | formal-methods-master-taxonomy | SOP: Formal Methods Master Taxonomy (The Blueprint of Proof) |
| system | any | formal-methods-tla-pluscal | SOP: Formal Methods — TLA+ and PlusCal Verification (The Blueprint Verifier) |
| system | any | generative-art-deployment | SOP: Generative Art Deployment (The Gallery Protocol) |
| system | any | market-gap-analysis | SOP: Full-Breath Market-Gap Analysis & Defensive Parrying |
| system | any | mcp-server-fleet-management | SOP: MCP Server Fleet Management (The Server Protocol) |
| system | any | multi-agent-swarm-orchestration | SOP: Multi-Agent Swarm Orchestration (The Polymorphic Swarm) |
| system | any | network-testament-protocol | SOP: Network Testament Protocol (The Mirror Protocol) |
| system | any | open-source-licensing-and-ip | SOP: Open Source Licensing and IP (The Commons Protocol) |
| system | any | performance-interface-design | SOP: Performance Interface Design (The Stage Protocol) |
| system | any | pitch-deck-rollout | SOP: Pitch Deck Generation & Rollout |
| system | any | polymorphic-agent-testing | SOP: Polymorphic Agent Testing (The Adversarial Protocol) |
| system | any | promotion-and-state-transitions | SOP: Promotion & State Transitions |
| system | any | recursive-study-feedback | SOP: Recursive Study & Feedback Loop (The Ouroboros) |
| system | any | repo-onboarding-and-habitat-creation | SOP: Repo Onboarding & Habitat Creation |
| system | any | research-to-implementation-pipeline | SOP: Research-to-Implementation Pipeline (The Gold Path) |
| system | any | security-and-accessibility-audit | SOP: Security & Accessibility Audit |
| system | any | session-self-critique | session-self-critique |
| system | any | smart-contract-audit-and-legal-wrap | SOP: Smart Contract Audit and Legal Wrap (The Ledger Protocol) |
| system | any | source-evaluation-and-bibliography | SOP: Source Evaluation & Annotated Bibliography (The Refinery) |
| system | any | stranger-test-protocol | SOP: Stranger Test Protocol |
| system | any | strategic-foresight-and-futures | SOP: Strategic Foresight & Futures (The Telescope) |
| system | any | styx-pipeline-traversal | SOP: Styx Pipeline Traversal (The 7-Organ Transmutation) |
| system | any | system-dashboard-telemetry | SOP: System Dashboard Telemetry (The Panopticon Protocol) |
| system | any | the-descent-protocol | the-descent-protocol |
| system | any | the-membrane-protocol | the-membrane-protocol |
| system | any | theoretical-concept-versioning | SOP: Theoretical Concept Versioning (The Epistemic Protocol) |
| system | any | theory-to-concrete-gate | theory-to-concrete-gate |
| system | any | typological-hermeneutic-analysis | SOP: Typological & Hermeneutic Analysis (The Archaeology) |

Linked skills: cicd-resilience-and-recovery, continuous-learning-agent, evaluation-to-growth, genesis-dna, multi-agent-workforce-planner, promotion-and-state-transitions, quality-gate-baseline-calibration, repo-onboarding-and-habitat-creation, structural-integrity-audit


**Prompting (Anthropic)**: context 200K tokens, format: XML tags, thinking: extended thinking (budget_tokens)


## Ecosystem Status

- **delivery**: 0/3 live, 1 planned
- **content**: 0/2 live, 1 planned
- **community**: 0/1 live, 0 planned

Run: `organvm ecosystem show metasystem-master` | `organvm ecosystem validate --organ II`


## Entity Identity (Ontologia)

**UID:** `ent_repo_01KKKX3RVJK1NJPGZ9JTRSSN77` | **Matched by:** primary_name

Resolve: `organvm ontologia resolve metasystem-master` | History: `organvm ontologia history ent_repo_01KKKX3RVJK1NJPGZ9JTRSSN77`


## Live System Variables (Ontologia)

| Variable | Value | Scope | Updated |
|----------|-------|-------|---------|
| `active_repos` | 89 | global | 2026-04-14 |
| `archived_repos` | 54 | global | 2026-04-14 |
| `ci_workflows` | 107 | global | 2026-04-14 |
| `code_files` | 0 | global | 2026-04-14 |
| `dependency_edges` | 60 | global | 2026-04-14 |
| `operational_organs` | 10 | global | 2026-04-14 |
| `published_essays` | 29 | global | 2026-04-14 |
| `repos_with_tests` | 0 | global | 2026-04-14 |
| `sprints_completed` | 33 | global | 2026-04-14 |
| `test_files` | 0 | global | 2026-04-14 |
| `total_organs` | 10 | global | 2026-04-14 |
| `total_words_formatted` | 0 | global | 2026-04-14 |
| `total_words_numeric` | 0 | global | 2026-04-14 |
| `total_words_short` | 0K+ | global | 2026-04-14 |

Metrics: 9 registered | Observations: 32128 recorded
Resolve: `organvm ontologia status` | Refresh: `organvm refresh`


## System Density (auto-generated)

AMMOI: 58% | Edges: 42 | Tensions: 33 | Clusters: 5 | Adv: 23 | Events(24h): 32336
Structure: 8 organs / 145 repos / 1654 components (depth 17) | Inference: 98% | Organs: META-ORGANVM:65%, ORGAN-I:53%, ORGAN-II:48%, ORGAN-III:54% +5 more
Last pulse: 2026-04-14T21:31:36 | Δ24h: -1.0% | Δ7d: n/a


## Dialect Identity (Trivium)

**Dialect:** AESTHETIC_FORM | **Classical Parallel:** Music | **Translation Role:** The Poetry — proves formal structures have sensory form

Strongest translations: III (structural), V (analogical), VI (analogical)

Scan: `organvm trivium scan II <OTHER>` | Matrix: `organvm trivium matrix` | Synthesize: `organvm trivium synthesize`


## Logos Documentation Layer

**Status:** MISSING | **Symmetry:** 0.0 (VACUUM)

Nature demands a documentation counterpart. This formation maintains its narrative record in `docs/logos/`.

### The Tetradic Counterpart
- **[Telos (Idealized Form)](../docs/logos/telos.md)** — The dream and theoretical grounding.
- **[Pragma (Concrete State)](../docs/logos/pragma.md)** — The honest account of what exists.
- **[Praxis (Remediation Plan)](../docs/logos/praxis.md)** — The attack vectors for evolution.
- **[Receptio (Reception)](../docs/logos/receptio.md)** — The account of the constructed polis.

### Alchemical I/O
- **[Source & Transmutation](../docs/logos/alchemical-io.md)** — Narrative of inputs, process, and returns.

- **[Public Essay](https://organvm-v-logos.github.io/public-process/)** — System-wide narrative entry.

*Compliance: Formation is currently void.*

<!-- ORGANVM:AUTO:END -->

## Conductor OS integration

This repository is a managed component of the ORGANVM meta-workspace.

- **Orchestration:** use `conductor patch` for system status and work queue.
- **Lifecycle:** follow `FRAME -> SHAPE -> BUILD -> PROVE`.
- **Governance:** promotions are managed through `conductor wip promote`.
- **Intelligence:** Conductor MCP tools may be available for routing and mission synthesis.
