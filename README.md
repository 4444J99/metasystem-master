# Omni-Dromenon Engine

> A research and artistic software system for audience-participatory performance: audience inputs are aggregated through weighted consensus while performers retain explicit override authority.

**Repository status:** active proof-of-concept under reproducibility and claim repair. Source code, tests, examples, infrastructure files, and extensive design documentation are present. A successful strict core-engine workflow, preserved benchmark artifact, current deployment record, rehearsal record, and live-performance validation have **not** yet been established for the current repair branch.

[Evidence status](docs/reproducibility/core-engine-evidence-status.md) · [Core engine](packages/core-engine/) · [Examples](examples/) · [Documentation](docs/) · [Contributing](.github/CONTRIBUTING.md)

---

## What this repository establishes

At the source level, the repository contains inspectable implementations or scaffolding for:

- a TypeScript core engine;
- audience-input collection and parameter aggregation;
- spatial, temporal, and agreement weighting;
- weighted-average, median, and cluster-majority modes;
- outlier filtering and smoothing;
- performer override modes: `absolute`, `blend`, and `lock`;
- a parameter bus and Socket.IO server paths;
- OSC and browser/audio integration paths;
- performer and audience interface packages;
- genre-oriented reference examples;
- container and cloud-configuration files;
- a seeded in-process consensus benchmark that emits JSON.

Those facts are implementation facts. They do not, by themselves, prove that the complete system builds, deploys, scales, delivers messages reliably, meets a latency target, works for performers or audiences, or has operated in rehearsal or live performance.

## Current evidence boundary

| Question | Current answer |
|---|---|
| Is there inspectable source for weighted consensus and performer override? | Yes. |
| Are deterministic functional tests and a benchmark entrypoint defined? | Yes. |
| Has the strict core workflow produced complete compiler/test logs at the current branch head? | Not yet; GitHub Actions terminates before runner steps are recorded. |
| Is there a preserved benchmark JSON artifact for the current branch? | Not yet. |
| Is any latency, throughput, delivery, error-rate, or connection-capacity result currently admissible? | No. Earlier numerical claims are being removed or reduced to explicit targets/history. |
| Is there current deployment evidence? | Not established. Infrastructure files are not deployment evidence. |
| Is there rehearsal or live-performance evidence? | Not established in the current evidence lane. |
| Is the system production ready? | Not established. |

The canonical claim register is [`docs/reproducibility/core-engine-evidence-status.md`](docs/reproducibility/core-engine-evidence-status.md).

---

## Research and design problem

The project asks how an audience can shape a performance without collapsing the performer into a servant of a vote.

The proposed authority model is neither unilateral authorship nor simple majority rule:

1. audience members contribute continuous parameter values;
2. the engine aggregates those values under a declared weighting model;
3. the performer can accept, resist, blend, or lock the resulting value;
4. the performance develops through repeated negotiation.

This is a design proposition implemented in code. Whether the proposition produces usable, legible, or artistically valuable interaction remains an empirical and practice-research question.

---

## Active architecture

```text
Audience and performer clients
            |
        Socket.IO
            |
      Parameter bus
            |
  Consensus aggregation
  - spatial component
  - temporal component
  - agreement component
  - filtering and smoothing
            |
   Performer override
            |
 Browser, dashboard, OSC,
 audio, or other outputs
```

Primary locations:

```text
packages/
  core-engine/               consensus, bus, server, OSC, types
  performance-sdk/           performer and audience UI components
  client-sdk/                lighter client integration
  audio-synthesis-bridge/    audio and OSC paths
  orchestrate/               separate Python orchestration package

examples/
  generative-music/
  generative-visual/
  choreographic-interface/
  theatre-dialogue/

infra/                       deployment scaffolding
docs/                        design, research, operations, and archive
```

The directory tree describes repository organization, not a claim that every package or example currently passes its build or integration tests.

---

## Core consensus model

For an input value `x_i`, the current core implementation computes:

- a spatial component from distance to the declared stage position;
- a temporal component from input age at an explicit evaluation time;
- an agreement component from nearby values in the current cohort.

These components are combined and clamped to a positive scalar weight. A weighted mean is then computed over the retained cohort, or a median/cluster mode is selected. Optional smoothing incorporates a prior value. Performer override is applied separately.

The current pairwise agreement calculation compares every input with the cohort. Therefore the dominant time complexity of one consensus call is `Theta(n^2)` for `n` inputs; auxiliary space is `O(n)`. No capacity claim follows from the presence of the implementation.

A formal, assessment-ready analysis of the bounds, determinism conditions, complexity, counterexamples, and code correspondence is maintained in the doctoral dossier repository and references the exact repair head.

---

## Reproducibility commands

From the repository root, with the locked workspace dependencies available:

```bash
pnpm install --frozen-lockfile
pnpm --filter @omni-dromenon/core-engine typecheck
pnpm --filter @omni-dromenon/core-engine test
pnpm --filter @omni-dromenon/core-engine test:bench -- \
  --output benchmark-results/consensus-baseline.json
```

The strict workflow is [`.github/workflows/core-engine-evidence.yml`](.github/workflows/core-engine-evidence.yml).

### Benchmark scope

The seeded benchmark evaluates only in-process calls to `computeConsensus` over deterministic cohorts of:

- 10 inputs;
- 100 inputs;
- 250 inputs;
- 500 inputs;
- 1,000 inputs.

For each cohort it declares the seed, fixed evaluation clock, warm-up count, measured-call count, timer, runtime, source revision, and summary statistics. It also requires identical consensus output across repeated calls in one process.

It excludes:

- network transport and clock synchronization;
- serialization;
- Socket.IO and browser behavior;
- Redis or other persistence;
- OSC transport;
- rendering and synthesis;
- audience-device latency;
- concurrent connection capacity;
- delivery, duplication, ordering, and error rates;
- rehearsal and live-performance behavior.

The benchmark deliberately asserts no threshold. Any future number must be described as **in-process consensus compute time in the recorded environment** unless a separate end-to-end protocol supports a broader statement.

---

## Core package

[`packages/core-engine/`](packages/core-engine/) contains the principal evidence lane.

Important files:

| Object | Path |
|---|---|
| Weighted consensus | `packages/core-engine/src/consensus/weighted-voting.ts` |
| Parameter aggregation | `packages/core-engine/src/consensus/parameter-aggregation.ts` |
| Bus | `packages/core-engine/src/bus/` |
| Server | `packages/core-engine/src/server.ts` |
| OSC path | `packages/core-engine/src/osc/` |
| Shared types | `packages/core-engine/src/types/` |
| Deterministic and functional tests | `packages/core-engine/tests/` |
| Seeded benchmark | `packages/core-engine/src/benchmarks/consensus-bench.ts` |
| Package evidence statement | `packages/core-engine/README.md` |

The current repair injects one evaluation clock through temporal weighting and result timestamps, removes randomized unit-test timing thresholds, adds deterministic invariants, and moves performance measurement into an artifact-producing benchmark lane.

---

## Reference examples

The examples are genre-oriented exploratory implementations, not equivalent to verified deployments.

| Example | Intended exploration | Current claim boundary |
|---|---|---|
| `generative-music` | audience control of musical parameters and browser/audio paths | inspectable proof-of-concept source; no preserved 2 ms, delivery, error-rate, participant, rehearsal, or performance result |
| `generative-visual` | consensus values mapped into visual parameters | implementation and build status require exact-head audit |
| `choreographic-interface` | movement and audience-input relationships | implementation, camera assumptions, rights, and evaluation require audit |
| `theatre-dialogue` | branch selection and performer authority | implementation and study status require audit |

Successful startup of an example would establish only that it starts in the named environment. It would not establish production readiness or artistic outcome.

---

## Interfaces and authority

The source defines three performer override modes:

- `absolute`: replace the computed value;
- `blend`: combine performer and audience values under a declared factor;
- `lock`: hold a performer-selected value.

This makes performer authority explicit in the interface. It does not prove that the authority model is understandable, fair, usable, or artistically successful. Those questions require participant-facing studies or documented practice research.

The outlier-removal and agreement-weighting mechanisms also carry governance consequences: a mathematically valid filter can suppress a minority signal. The implementation must therefore be evaluated not only for numerical correctness, but for how its rules distribute voice and intervention.

---

## Design targets are not results

Historical documentation names targets such as low latency, high connection capacity, bounded memory, and fixed broadcast cadence. Until measured artifacts exist, these remain unvalidated engineering targets.

A target may stay in active documentation only when it is clearly labeled as a target and not presented as achieved. Reinstating a numerical result requires:

1. an exact source revision;
2. a declared workload and environment;
3. preserved raw and summary artifacts;
4. repeated runs rather than a selected best run;
5. scope-specific wording;
6. a distinction among local computation, end-to-end networking, deployment, rehearsal, and live performance.

---

## Documentation states

The repository contains documents created at different times and maturity levels.

- **Active evidence documentation** should reflect the current repository and link claims to exact evidence.
- **Design documents** may describe proposed architecture or artistic intent, but must identify that status.
- **Grant or submission drafts** are proposals, not proof that the described work occurred.
- **Historical cold storage** under `docs/reference/omnidramanon-cold-storage/` preserves earlier records and claims; it must not be used silently as current evidence.

The presence of a document, diagram, deployment file, screenshot, or portfolio page is not proof of runtime behavior.

---

## Current work gates

The core evidence lane remains incomplete until:

1. a runner executes checkout, locked install, typecheck, tests, benchmark, and artifact upload;
2. exact compiler and test output is preserved at one head;
3. the first JSON benchmark artifact is retained;
4. all remaining active unsupported metrics are removed or marked as targets/history;
5. repeated environmental runs are collected before any stable numerical claim;
6. an end-to-end protocol is defined before network or participant-capacity claims;
7. rehearsal and live-performance records identify date, context, participants, revision, media provenance, failures, and limitations.

---

## Contributing

Contributions should state which evidence class they affect:

- implementation;
- deterministic check;
- benchmark or experiment;
- deployment observation;
- rehearsal observation;
- live-performance observation;
- design proposal;
- historical archive.

Do not describe code as deployed because it builds, or a benchmark as audience latency because it times one function.

General contribution guidance is in [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md).

---

## License and authorship

MIT License. See [`LICENSE`](LICENSE).

Primary author and repository steward: Anthony Padavano ([@4444J99](https://github.com/4444J99)).

This repository is part of the broader ORGANVM corpus. That institutional relationship does not alter the evidence boundary of this individual project.

<!-- SYSTEM-NAV-START -->

---

<sub>[Case Study](https://4444j99.github.io/portfolio/projects/metasystem-master/) · [Portfolio](https://4444j99.github.io/portfolio/) · [System Directory](https://4444j99.github.io/portfolio/directory/) · [ORGAN II · Poiesis](https://organvm-ii-poiesis.github.io/) · Part of the <a href="https://4444j99.github.io/portfolio/directory/">ORGANVM system</a></sub>

<!-- SYSTEM-NAV-END -->
