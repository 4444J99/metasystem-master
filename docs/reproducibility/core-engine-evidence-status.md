# Core-Engine Evidence Status and Claim Register

**Audit date:** 2026-09-03  
**Audited source baseline:** `7b5fbac49b50993878f6842e4e7648491a8a662c`  
**Repair branch:** `phd/omni-reproducibility-baseline-2026-09-03`  
**Source head assessed immediately before this register update:** `18f24bec1f7aa6c2b857767764612a62bb9bcb91`  
**Interpretation:** this register distinguishes inspectable implementation, static structure, deterministic checks, compiler results, measured artifacts, deployment observations, rehearsal observations, and live-performance evidence.

## Current status

The branch now contains an inspectable, claim-bounded core evidence lane with:

- explicit non-interactive typecheck, full-test, benchmark, and combined evidence commands;
- a strict GitHub Actions workflow using locked dependency installation;
- a pre-install active-claim gate over nineteen current source, test, documentation, web, and proposal surfaces;
- a pre-install evidence-structure gate checking script wiring, required nonempty test files, workflow steps, benchmark scope, source-revision capture, and the absence of a benchmark threshold;
- deterministic consensus, aggregation, bus, audience-input, and performer-override tests using explicit clocks or fake timers rather than real-time sleeps;
- a seeded in-process benchmark over 10, 100, 250, 500, and 1,000 inputs;
- JSON benchmark output containing source revision, runtime, seed, evaluation time, input-age policy, cohort sizes, timing definition, scope, output value, and summary statistics;
- an equality guard requiring identical consensus output across every warm-up and measured call in one process;
- repaired active narratives that no longer present the inherited latency, delivery, error-rate, capacity, deployment, or production-readiness language as established results.

Two attempts of the strict workflow at source head `18f24bec1f7aa6c2b857767764612a62bb9bcb91` failed before any runner step was recorded:

| Run | Attempt | Job | Created | Completed | Steps | Runner |
|---|---:|---:|---|---|---:|---|
| `33794038350` | 1 | `100777293819` | 2026-09-03 19:02:07 UTC | 19:02:10 UTC | 0 | `runner_id: 0`; no name or group |
| `33794038350` | 2 | `100778114606` | 2026-09-03 19:04:38 UTC | 19:04:49 UTC | 0 | `runner_id: 0`; no name or group |

Both attempts expose a failure conclusion but no checkout, gate, installation, compiler, test, benchmark, upload step, log, runner identity, or artifact. Other repository workflows failed in the same pre-run manner on the same source head.

The correct classification remains:

`infrastructure_execution_blocked`

It is not correct to classify either attempt as:

- a claim-gate failure;
- a dependency-installation failure;
- a TypeScript failure;
- a unit-test failure;
- a benchmark failure;
- a performance result;
- evidence for or against the earlier numerical claims.

No performance threshold or numerical result is asserted by the benchmark or this register.

## Evidence vocabulary

| State | Meaning |
|---|---|
| `implemented_unexecuted` | Inspectable source exists, but the declared command has not produced preserved output at the audited head. |
| `static_structure_checked` | A dependency-free structural gate completed and supports only the named wiring or text property. |
| `checked_bounded` | A deterministic test, compiler check, or static gate completed and supports only the named property. |
| `measured_environmental` | A preserved artifact records a measurement in one fully declared environment. |
| `repeated_environmental` | Comparable artifacts exist across repeated runs and declared environments. |
| `deployed_observed` | Instrumentation from an identified deployment supports a bounded operational claim. |
| `rehearsal_observed` | A declared rehearsal with participants and protocol supports a bounded use claim. |
| `performance_observed` | A declared live performance with methods and evidence supports a bounded outcome claim. |
| `target_only` | A desired engineering target is stated without evidence that it has been met. |
| `unsupported_active_claim` | An active surface presents an unpreserved or mismatched result as established. |
| `historical_source_claim` | A preserved historical document contains a claim that must not be inherited as current evidence. |
| `infrastructure_execution_blocked` | The execution service did not assign or start a runner, so code-level outcome is unobserved. |

## Current admissible claims

At the current repair branch, it is admissible to say:

1. The repository contains an inspectable weighted-consensus implementation combining spatial, temporal, and agreement terms.
2. The repository contains declared performer-override modes and inspectable code paths for applying them.
3. The branch defines deterministic functional tests and a seeded, artifact-producing in-process benchmark.
4. A fixed evaluation clock controls temporal weighting and consensus result timestamps in deterministic paths.
5. Future-dated input is treated as age zero, preventing the temporal component from exceeding one under clock skew.
6. Parameter aggregation rejects inputs whose session identifier does not match the aggregator's session.
7. Snapshot pruning, consensus results, active-participant counts, and snapshot timestamps can be evaluated against one supplied clock.
8. Expired overrides are removed from both the override index and exposed aggregation state; replacement ownership is removed from the prior performer's index.
9. Bus, batching, rate-limit, and server timers now have explicit cleanup or non-owning lifecycle behavior in the inspected source.
10. The benchmark records its seeded input-age distribution and asserts no pass/fail latency threshold.
11. The current agreement calculation compares each input with the cohort and therefore gives the consensus call a `Theta(n^2)` dominant time term and `O(n)` auxiliary space.
12. The known active surfaces no longer present the earlier 2 ms, `<5ms`, perfect-delivery, zero-error, stadium-capacity, or production-readiness language as achieved results.
13. Two exact-head workflow attempts were blocked before runner assignment.

It is not yet admissible to say that the branch has passed its claim gate, structure gate, locked install, typecheck, or tests; produced a benchmark artifact; achieved a latency value; met a latency target; sustained a participant count; delivered messages at a stated rate; produced a stated error rate; operated in rehearsal; operated in live performance; or is production ready.

## Correctness and reproducibility repairs in this tranche

| Finding | Earlier condition | Repair now present in source | Evidence state |
|---|---|---|---|
| Live-clock benchmark dependency | Fixed input timestamps were weighted against live `Date.now()` | Injected one evaluation clock through weighting, consensus, aggregation, snapshots, tests, and benchmark | `implemented_unexecuted` |
| Future timestamp amplification | Negative age could make temporal weight exceed one | Input age is clamped at zero and covered by a deterministic assertion | `implemented_unexecuted` |
| Invalid timing unit test | A randomized single run asserted `<10ms` | Timing threshold removed from unit tests; measurement isolated in benchmark lane | `implemented_unexecuted` |
| Internally inconsistent outlier fixture | Five observations placed the nominal outlier below the declared 2.5-sigma boundary | Fixture now uses six central observations plus one separated value, placing it beyond the declared boundary | `implemented_unexecuted` |
| Cluster-order defect | Bimodality inspected the first two value-sorted clusters rather than the two densest | Modality is evaluated from density-ranked clusters with a three-cluster regression case | `implemented_unexecuted` |
| Cross-session contamination | Aggregator accepted any input carrying a known parameter | Input session identifier must match the aggregator session | `implemented_unexecuted` |
| Split-clock snapshots | Pruning, computation, participant counts, and metadata could sample different times | A shared evaluation time is threaded through snapshot computation | `implemented_unexecuted` |
| Stale aggregation override | Expired override could remain exposed in aggregation state | Expiry clears map and state together | `implemented_unexecuted` |
| Stale performer ownership | Replacing or removing an override could leave an obsolete owner index | Ownership transfer and teardown update both indexes | `implemented_unexecuted` |
| Wall-clock and post-test assertions | Bus tests used sleeps and one assertion could execute after test completion | Fake timers and synchronous boundary assertions replace real-time waits | `implemented_unexecuted` |
| Open timer handles | Bus, batching, rate-limit, and server intervals lacked a complete lifecycle contract | Timers are unreferenced where appropriate and explicit disposal/destroy paths are present | `implemented_unexecuted` |
| Invalid UUID API | Core source imported a nonexistent `v4` export from Node `crypto` | Source uses `randomUUID` from `node:crypto` | `implemented_unexecuted` |
| Zod 4 API drift | Record and error access followed older API forms | Record declares key and value schemas; error formatting uses `issues` | `implemented_unexecuted` |
| Test-command drift | Package test command named only two files, excluding newly added substantive tests | `vitest run --reporter=verbose` addresses every discovered test file | `implemented_unexecuted` |
| Empty test shell | Zero-byte OSC test file could be mistaken for coverage | Empty shell removed; structure gate rejects future empty test files | `implemented_unexecuted` |
| Underspecified benchmark timestamps | Manifest said only that timestamps were fixed | Manifest records the seed derivation, fixed evaluation epoch, exact age formula, and inclusive/exclusive range | `implemented_unexecuted` |
| Evidence-lane drift | Workflow wiring and script scope could change without an early signal | Dependency-free structure gate checks scripts, tests, workflow fragments, source revision, scope, and null threshold | `implemented_unexecuted` |
| Narrow active-surface scan | Claim gate did not include several newly material source and test surfaces | Active scan expanded to nineteen named files | `implemented_unexecuted` |

These rows preserve discovered corrections. They do not establish that every remaining correctness issue has been found.

## Known mathematical, implementation, and specification limits

- Runtime Zod schemas constrain boundary data, but direct TypeScript callers can bypass them.
- `WeightingConfig` still needs a runtime schema for assumptions such as a positive temporal window, nonnegative coefficient values, bounded smoothing, and coherent coefficient normalization.
- Agreement excludes peers by identifier; uniqueness of identifiers within a cohort is a semantic precondition not yet enforced at cohort level.
- Weighted floating-point accumulation may be sensitive to input order and runtime architecture. Same-process equality does not establish cross-runtime bit identity.
- Outlier removal can suppress a coherent minority even when the numerical procedure is implemented as specified.
- The median implementation chooses one observed middle value for even cohorts rather than averaging the two central values; that is a current semantic choice, not a statistically neutral default.
- Parameter-bus distribution methods inside `PerformerSubscriptions` remain placeholders; source presence does not establish socket delivery.
- The bus statistics object reports no measured queue depth or latency. Explicit zero placeholders must not be interpreted as observed zero queueing or zero latency.
- OSC behavior has no substantive test in this PR; removing an empty shell prevents false coverage but does not supply replacement evidence.
- Authentication still uses a configured prototype shared secret. This PR does not establish production security.
- A sorted sliding-window or binary-search method could reduce exact threshold-neighbor counting from `Theta(n^2)` to `O(n log n)`, but equivalence has not been implemented or proved here.

## Benchmark boundary

The benchmark includes:

- deterministic pseudo-random inputs from recorded seed `0x4f4d4e49`;
- cohort seed derivation by seed XOR input count;
- fixed evaluation epoch `1800000000000`;
- input timestamps derived as `evaluation epoch - floor(PRNG * 5000)`;
- 10 warm-up calls and 50 measured calls per cohort;
- cohorts of 10, 100, 250, 500, and 1,000 inputs;
- minimum, mean, p50, p95, maximum, and operations per second;
- an equality check requiring identical consensus output across all calls;
- runtime, platform, architecture, CI state, source revision, timer, percentile definition, and output value;
- JSON output intended for workflow preservation;
- no performance threshold.

It excludes:

- network transport and clock synchronization;
- serialization and deserialization;
- Socket.IO and browser behavior;
- Redis or other persistence;
- OSC routing;
- rendering and audio synthesis;
- audience-device latency;
- concurrent connection capacity;
- delivery, duplication, ordering, and error rates;
- rehearsal conditions;
- live-performance behavior and reception.

A future numerical result from this benchmark must be named as **in-process consensus compute time in the recorded environment**, not as end-to-end system latency.

## Active claim register

| Surface | Earlier claim form | Classification at audit | Repair status | Required evidence before reinstatement |
|---|---|---|---|---|
| `packages/core-engine/src/consensus/weighted-voting.ts` | `Validated: P95 latency <5ms for 1000 inputs` | `unsupported_active_claim` | Removed; source points to benchmark and asserts no threshold | Preserved repeated artifacts for the exact implementation; wording remains in-process only |
| `packages/core-engine/tests/consensus.test.ts` | randomized single-run `<10ms` assertion | invalid performance test | Replaced with deterministic functional assertions | Performance remains in benchmark lane |
| `packages/core-engine/README.md` | `Proof-of-concept validated (P95 latency: 2ms)` | `unsupported_active_claim` | Replaced with current evidence state, scope, and commands | Completed strict workflow plus repeated artifacts |
| `examples/generative-music/README.md` | `2ms`, `100%` delivery, `0%` error presented as actual | `unsupported_active_claim` | Replaced with standalone-example boundary and measurement gate | Versioned end-to-end protocol and raw artifacts |
| `examples/generative-music/src/server/index.js` | startup banner and header declared validated `2ms` | `unsupported_active_claim` | Startup explicitly states no validation | Same end-to-end protocol above |
| root `README.md` | sub-second negotiation, validation path, capacity, deployment, and active-result implications | mixed target and unsupported implication | Replaced with evidence-bounded reader mode | Exact measured, deployed, or rehearsal artifacts |
| `infra/web/index.html` | `2ms`, `100%`, zero errors, `50+`, production-ready, demo/performance assertions | `unsupported_active_claim` | Replaced with accessible evidence-status interface | Deployment instrumentation, participant protocol, and media provenance |
| `CLAUDE.md` | `<2ms` target adjacent to architecture | `target_only` but easily misread | Targets explicitly unvalidated; coding agents routed through this register | Preserved measurement before result wording |
| `docs/business/GRANT_MATERIALS/ars-electronica-narrative-DRAFT.md` | quantitative validation, scale, partnership, fallback, and future-event implications | `unsupported_active_claim` in proposal surface | Recast as evidence-bounded research proposal | Official call, partner, budget, rights, and evidence verification |
| `docs/reference/omnidramanon-cold-storage/**` | inherited historical metrics and completion claims | `historical_source_claim` | Preserved as cold storage and excluded from active gate | Never inherit as current evidence without independent recovery |

## Executable gates

### Pre-install gate 1 — active claim boundary

`tools/check-core-claim-boundaries.mjs` reads nineteen named active surfaces and rejects exact forms of the known unsupported result language. Historical cold storage and explicitly labeled target tables remain outside this narrow gate.

### Pre-install gate 2 — evidence-lane structure

`tools/check-core-evidence-structure.mjs` checks:

- exact package command wiring;
- presence of four required nonempty test files;
- absence of empty discovered test files;
- strict workflow fragments;
- locked dependency installation;
- typecheck, full-test, benchmark, and artifact-upload lanes;
- benchmark source-revision capture;
- explicit in-process scope;
- `threshold: null`.

This is a structural control only. It cannot establish compiler correctness, test passage, numerical performance, deployment, or use.

Both gates remain `implemented_unexecuted` at the recorded source head because no runner step began.

## Execution gates

### Gate A — runner execution

- obtain a GitHub-hosted or declared self-hosted runner assignment;
- preserve checkout and both pre-install gate outputs;
- preserve locked installation, compiler, test, and benchmark logs;
- preserve `consensus-baseline.json` as an artifact;
- record exact source head and dependency lock state.

### Gate B — deterministic correctness

- both static gates pass at the exact head;
- typecheck passes at the exact head;
- all discovered tests pass at the exact head;
- benchmark equality guard passes;
- any failure is preserved rather than summarized away.

### Gate C — repeated in-process measurement

- run at least five repetitions per declared environment;
- preserve every raw JSON artifact, including slow and failed runs;
- report distributions across runs rather than selecting the best result;
- compare runtime and hardware environments without combining them.

### Gate D — end-to-end system measurement

- define client, server, network, clocks, serialization, connection count, event rate, and failure handling;
- instrument event lifecycle rather than inferring latency from acknowledgements alone;
- preserve delivery, duplication, ordering, disconnect, and error records;
- distinguish local simulation from deployed network behavior.

### Gate E — rehearsal and live-performance evidence

- identify date, venue or context, participant count, hardware, software revision, and protocol;
- preserve logs and source media with rights and credits;
- record performer override use, failures, dropouts, and audience behavior;
- separate technical operation from artistic or experiential evaluation.

## Draft-PR exit criteria

PR #70 should remain draft until:

- a runner executes every strict step and exposes complete logs;
- both pre-install gates, locked install, compiler, and all tests are classified at one exact head;
- the first JSON benchmark artifact is preserved;
- this register links to the observed artifacts;
- no review language converts unexecuted code into successful evidence.

The known active narrative claim debt identified in this audit is repaired on the branch. Execution evidence remains the principal external gate.


## September 9 source and execution correction

This dated update supersedes conflicting earlier current-status sentences without changing the historical record. Production source `6f1270d793217783889b5f22779f34ad93228247` descends from evidence integration `18a8e31441b39af26a997d1916ae6238fb2158bd`. The September6 isolated experiment source remains `323c12f6c17753b0b408a3f0e34265939395d864`; historical outputs and missing-provenance attempts were not rewritten.

All11 changed file bytes and75 materialized Git blobs were verified against the new source commit. The identical earlier candidate passed pinned pnpm9.15 frozen installation, both preinstall gates,26 claim-verifier regression tests, strict core typecheck and65 core tests across6 files. Earlier TS7016 and candidate TS2883 compiler failures remain preserved; the final source-identical compiler run passed. These results do not establish that all repository packages or GitHub Actions ran.

After commit verification, five new canonical benchmark processes used the exact source SHA, preserving1250 measured calls and250 warmups with unchanged rounded outputs. Full-dependency probes preserved500 minority fixtures,19 aggregator assertions (17 retained plus2 epoch-zero cleanup assertions) and8 real OSC codec/event cases with socket opening stubbed. Epoch-zero expiry is repaired; minority filtering, invalid direct smoothing, temporal discontinuity and median policy remain unchanged observations. See [the committed-source evidence](convergence-2026-09-09/README.md), its protocol, source identities, raw archive and receipts.

The exact-source push run34403004996/job102639174869 and PR run34403010684/job102639195448 each report runner_id0, no steps and no artifacts. Gate A remains `infrastructure_execution_blocked`. Local correctness and repeated compute evidence do not close the workflow-specific gate, end-to-end Gate D, or rehearsal/live Gate E. No applicant mastery or social/artistic outcome claim follows.

A subsequent local Node20.20.2 compatibility run at the exact source SHA passed both preinstall gates,26 verifier tests, strict core typecheck,65 core tests and one canonical benchmark (250 measured calls,50 warmups). It reused the frozen dependency tree installed under Node24. This closes the observed local Node20 launcher/runtime compatibility question; it does not establish a fresh Node20 dependency installation, repeated Node20 measurements or GitHub execution.
