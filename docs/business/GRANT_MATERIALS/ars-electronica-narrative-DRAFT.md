# Grant Narrative Draft: Omni-Dromenon

**Original concept date:** 2025-12-26  
**Evidence-bounded revision:** 2026-09-03  
**Author:** Anthony Padavano  
**Status:** internal concept draft; not a submitted application, not evidence of selection or institutional partnership, and not yet tailored to a verified current call

## Editorial truth boundary

This revision preserves the proposed artistic research while removing unsupported statements that the system has already achieved 2 ms latency, horizontal scale, stadium capacity, production-grade operation, graceful network fallback, malicious-actor detection, 1.5-second interface loading, rehearsal validation, or live-performance validation.

The current repository contains inspectable proof-of-concept source, deterministic test definitions, an artifact-producing in-process benchmark, interface and deployment scaffolding, and extensive design documentation. The strict core workflow has not yet recorded runner steps or produced its first JSON benchmark artifact for the repair branch. No current operational number is asserted here.

This document must not be submitted until the target call, eligibility, dates, required fields, word limits, budget rules, and host relationship have been verified from official sources.

## 1. Project premise: from response to negotiated authorship

Live performance already contains feedback between performers and audiences: attention, silence, movement, applause, withdrawal, and resistance shape what happens in a room. Yet those signals are usually informal, unevenly legible, and interpreted solely by the performer.

Omni-Dromenon asks whether a computational interface can make selected parts of that exchange explicit without reducing performance to a poll.

The project treats audience participation as a constrained contribution to a live compositional process. Audience members supply values for parameters chosen by the artist. A consensus process combines those inputs under declared rules. The performer retains explicit authority to accept, blend, resist, or lock the result. The artistic object is therefore not crowd control or performer control alone, but repeated negotiation between them.

The central research problem is not merely technical responsiveness. It is legible authority:

> How can a participatory performance system distribute meaningful influence while preserving the performer's responsibility for the work?

## 2. Current technical object

The repository contains a TypeScript core engine and related packages exploring:

- audience-input collection;
- spatial, temporal, and agreement weighting;
- weighted-average, median, and cluster-majority aggregation;
- outlier filtering and smoothing;
- performer override modes: `absolute`, `blend`, and `lock`;
- parameter-bus, Socket.IO, OSC, interface, and audio-integration paths;
- genre-oriented examples;
- a seeded benchmark for in-process consensus computation.

The current pairwise agreement method has quadratic time complexity in the number of inputs. Its performance and capacity therefore require measurement rather than assertion. The benchmark deliberately makes no pass/fail threshold and excludes network transport, Socket.IO, browser behavior, persistence, OSC, rendering, devices, rehearsal, and live-performance conditions.

The project is open-source research software under active repair. It should be presented as a working field of investigation, not as a finished platform.

## 3. Artistic method

A residency version would begin with a deliberately narrow parameter set rather than exposing every possible control. For example, an artist might make only density, brightness, harmonic tension, movement amplitude, or narrative pressure available to the audience.

Each parameter would be treated as a compositional contract:

1. What can the audience influence?
2. How is influence weighted?
3. What information does the audience see about the current state?
4. When can the performer intervene?
5. Is intervention visible, hidden, or interpretable?
6. What happens when inputs disagree?
7. What kinds of minority signal should the system preserve rather than filter?

The performer-override mechanism is not a backstage emergency switch. It is part of the score. A performer may follow a collective tendency, delay it, oppose it, blend with it, or expose the act of refusing it. Those decisions can create tension and form without pretending that the audience and performer possess identical authority.

## 4. Research questions

A residency or funded development period would investigate five linked questions.

### 4.1 Legibility

Can participants tell what influence they have, what the group is doing, and when performer intervention changes the outcome?

### 4.2 Authority

Which override and filtering rules preserve artistic responsibility without rendering participation cosmetic?

### 4.3 Difference

How should the system represent disagreement? A mean can erase polarity, while outlier removal can silence a coherent minority. Alternative visualizations and aggregation rules need comparison.

### 4.4 Temporality

How quickly should a collective state change? Technical speed is not automatically artistic responsiveness; smoothing and delay may be compositional materials.

### 4.5 Reproducibility

Which claims can be supported by source, deterministic checks, in-process measurement, end-to-end instrumentation, rehearsal observation, and participant research?

## 5. Proposed development sequence

The following sequence is a modular plan, not a promise that named institutions, venues, or public events have already agreed to participate.

### Phase 1 - Reproducible core

- obtain a complete locked-environment typecheck and test run;
- preserve the first seeded benchmark artifact at an exact source revision;
- validate runtime configuration boundaries;
- compare the current quadratic agreement calculation with an equivalent `O(n log n)` approach;
- retain failures and counterexamples.

### Phase 2 - Instrumented network prototype

- define client, server, hardware, clocks, network, serialization, connection count, and event rate;
- instrument event lifecycle rather than inferring latency from acknowledgements;
- record delivery, duplication, ordering, disconnect, and error behavior;
- make graceful-degradation modes explicit and testable.

### Phase 3 - Artist workshop

- select one medium and one small parameter vocabulary;
- co-design the authority contract with participating artist or ensemble;
- conduct private sessions before public claims;
- record performer interpretation, intervention, breakdowns, and requested revisions.

### Phase 4 - Participant study or documented rehearsal

- define recruitment, consent, privacy, retention, and analysis procedures appropriate to the host context;
- test whether audience members understand their individual and collective influence;
- examine disagreement, minority signals, latency perception, and override legibility;
- separate technical operation from reported experience.

### Phase 5 - Public presentation

A public performance or installation would occur only after the technical and human-facing gates above. The record would identify date, venue, participant count, hardware, software revision, parameters, failures, media rights, and limitations.

### Phase 6 - Publication and release

- publish the exact source and reproducibility materials used;
- release bounded technical findings without converting one environment into a universal capacity claim;
- publish a practice-research account of the authority model;
- provide an artist-facing toolkit derived from observed needs rather than imagined completeness.

## 6. Intended outputs

A funded period could produce:

1. a reproducible core-engine release candidate;
2. preserved compiler, test, benchmark, and network-measurement artifacts;
3. one documented artist configuration or score;
4. performer and audience interfaces for that bounded use case;
5. a rehearsal or study protocol and findings, when ethically and institutionally appropriate;
6. a public demonstration whose status is accurately recorded;
7. a technical paper on aggregation, complexity, and measurement;
8. a practice-research paper on negotiated authorship and legible authority;
9. an open artist toolkit with explicit maturity labels.

## 7. Risks and research value

### Network instability

Dense wireless environments may cause latency, loss, reordering, or disconnection. The project has not yet proved a fallback mechanism. A funded phase would define and test performer-lock, local-network, degraded-update, and failure-display modes rather than assuming them.

### Cosmetic participation

Audience contribution may feel consequential in code but negligible in experience. The mitigation is not stronger rhetoric; it is observable state, participant research, and revision of the authority contract.

### Majority dominance

Agreement weighting and outlier filtering can amplify convergence and suppress minority positions. This is both a technical risk and an artistic research question. Competing aggregation and visualization modes should be evaluated.

### Performer overload

A dashboard can burden the performer with monitoring and intervention. The project should test minimal controls, automation boundaries, and score-based cues rather than assuming more information is better.

### Configuration error

Numeric interfaces do not enforce all mathematical preconditions. Runtime configuration validation, property tests, and failure-safe defaults are required.

### Evidence inflation

The repository contains historical drafts and aspirational documents. The project maintains a claim register so that source, test, benchmark, deployment, rehearsal, and live-performance evidence are not conflated.

## 8. Significance

Omni-Dromenon's contribution is not that computation will make performance democratic, nor that lower latency automatically creates better art. Its contribution is a concrete system in which authority rules can be written, exposed, contested, measured, and revised.

The project makes several normally implicit questions available as artistic and technical material:

- Who is permitted to shape the work?
- How is collective influence calculated?
- What happens to disagreement?
- Who can refuse the group?
- Can participants understand the rules acting on them?
- Which parts of the interaction are proven, observed, proposed, or imagined?

A residency would supply the context needed to answer those questions through implementation, rehearsal, participant encounter, and critical reflection rather than through product claims alone.

## 9. Submission gates

Before adapting this draft for any call:

- verify the current official call and deadline;
- verify applicant and project eligibility;
- verify whether a host, ensemble, or partner relationship is required;
- remove every named organization not formally involved;
- match required word counts and questions;
- create a budget from eligible cost categories;
- attach only current evidence objects;
- obtain rights and credits for every media item;
- distinguish proposed activity from completed activity;
- obtain a second factual and citation review.
