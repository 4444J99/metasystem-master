# Dependency-isolated source experiment protocol

Recorded before first runtime execution of this tranche; 2026-09-06.
Source revision: organvm/metasystem-master 323c12f6c17753b0b408a3f0e34265939395d864.
Assistant-authored protocol and harness; not evidence of applicant independent mastery.

## Execution boundary
Full checkout/frozen dependency installation cannot run here: direct GitHub and npm DNS resolution failed. Node 22.16.0 and TypeScript 5.8.3 are installed. Do not equate this experiment with the repository test suite, full typecheck, dependency validation, or GitHub Actions.

Preserve byte-identical original weighted-voting.ts, consensus.ts, and consensus-bench.ts. Verify Git blob identities before running. Extract only the original ConsensusMode enum and DEFAULT_WEIGHTING_CONFIG declaration using the TypeScript parser. Transpile, without semantic edits, those declarations and the original weighted-voting.ts; resolve its types barrel to these two original runtime declarations. This omits Zod and unrelated type-barrel runtime initialization, which are not under test. Unknown imports must fail closed; no mock consensus implementation.

## Questions / measurements

E0: Does the original seeded benchmark execute in this isolated environment? Run three separate Node processes. Preserve each unmodified benchmark JSON and stdout/stderr. Verify cohort counts, within-process equality guards, and cross-process rounded output agreement. Timings are descriptive only, not thresholds or stable latency claims.

E1: When two internally coherent groups choose 0 and 1, how do agreement weighting and outlier filtering affect minority retention? Sweep minority count 1..50 of 100, with equal timestamps and stage locations, unique IDs, default configuration, no smoothing. Preserve raw mean, weighted mean, filtered IDs/count, confidence, and participation. Compare outlier thresholds 1, 2, 2.5, 3 and Infinity, and agreement coefficient 0 (other coefficients unchanged). Do not equate computational minority suppression with an observed social outcome.

E2: What happens at the time window? Measure temporal weight for ages -5000,-1,0,4999,5000,5001,10000 at a fixed time. Record future-time behavior and any discontinuity. No transport/clock-sync claim.

E3: What is override-active behavior for absent expiry, expiry zero, expiry one millisecond before, at, and after evaluation time? Measure the predicate, not server timer ownership. Compare absolute/blend/lock application separately. Use epoch-zero as an explicit boundary probe, not an ordinary current-time input.

E4: How do direct function calls behave under invalid WeightingConfig values? Probe zero/negative temporal window, NaN coefficient, negative outlier threshold, smoothing factor 2; record non-finite values, throws, and output outside [0,1]. These are direct-call contract tests, not proof of externally exploitable behavior or that middleware accepts inputs.

E5: For even-sized cohorts, does MEDIAN return the averaged middle or one middle value? Compare default weighted mode and median at a fixed time, no smoothing. Check permutation sensitivity on exact tie cases in majority mode; report observed semantics without prescribing artistic policy.

Predeclared fixtures may be extended only in a separately labeled post-observation follow-up, with the initial output retained.

## Integration rule
Preserve source identities, loader, protocol, results and logs. Keep canonical CI gate open. Do not repair policy-dependent behavior (e.g. outlier removal) without an explicit decision about intended semantics. Any discovered narrow bug repair must have separate before/after evidence.

## E6 extension: aggregator boundary tests (declared after E0-E5, before E6 execution)

Recover and verify original parameter-aggregation.ts. Test two aggregators receiving the same mixed-session batch, unknown/noncontrollable parameters, exact pruning cutoff, valid override expiry cleaning both map/public state, replacement of an override across the old expiry boundary, and reset. Separately preserve the expiry-zero counterexample already found by E3 at aggregator level. No server timer, network session/authentication, or callback-ownership claim follows from these direct synchronous aggregator calls. Record returned state and assertions.

## E0 replication extension (declared after the three initial processes)

The canonical register calls for at least five repetitions per environment. Execute two additional fresh processes in this same dependency-isolated environment, preserving all output. This adds repetitions, not environments, locked-install validation, or a canonical Gate C closure. The original three-process protocol and failed attempts remain preserved. Do not select or average away slow runs.

The first two extension outputs recorded sourceRevision=null because the launcher omitted SOURCE_REVISION. Their original JSON/logs are preserved in results/metadata-omission-attempt; the loader still verified source blobs. Rerun both with SOURCE_REVISION explicitly set; do not edit provenance into existing benchmark JSON. Qualified baseline counts refer to the five revision-tagged outputs, not to these two additional observed runs.
