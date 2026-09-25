# Example: Generative Music

Legacy proof-of-concept demonstrating audience-controlled generative music synthesis through a standalone Node.js and Socket.IO server.

## Evidence status

This example contains inspectable source for audience input collection, weighted aggregation, performer override, state broadcast, and browser-based audio control. The repository does **not** currently contain a preserved, reproducible artifact supporting earlier claims of 2 ms P95 latency, 100% message delivery, 0% errors, a particular participant count, or live-performance validation.

The strict benchmark introduced in `packages/core-engine` measures a different and narrower object: in-process `computeConsensus` only. Its results must not be presented as network, delivery, concurrency, audience-device, or performance evidence for this standalone example.

## Quick start

```bash
npm install
npm start

# Audience:  http://localhost:3000
# Performer: http://localhost:3000/performer.html
```

Successful local startup would establish only that the example runs in the declared environment. It would not establish production readiness or the performance claims listed above.

## Architecture

```text
Audience clients --Socket.IO--> standalone server --state updates--> all clients
                                     |
                                     +--> weighted temporal/proximity aggregation
                                     +--> performer override state
```

## Parameters

| Parameter | Range | Intended effect |
|---|---:|---|
| Mood | 0-1 | Dark to bright filtering and reverb |
| Tempo | 0-1 | Slow to fast BPM mapping |
| Intensity | 0-1 | Calm to chaotic dynamics and density |
| Density | 0-1 | Sparse to dense note activity |

## Consensus algorithm

The standalone example uses temporal decay and proximity to the current state:

```text
weight = temporal_decay * consensus_proximity
```

- `BETA_TEMPORAL = 0.6`: controls recency weighting.
- `GAMMA_CONSENSUS = 0.4`: controls proximity weighting.
- `CONSENSUS_SMOOTHING = 0.15`: controls interpolation toward the computed value.

These constants are implementation choices, not validated optimal parameters.

## Files

```text
src/
├── server/
│   └── index.js          # standalone server and aggregation logic
└── public/
    ├── index.html        # audience interface
    ├── performer.html    # performer interface
    ├── style.css         # shared styles
    └── client.js         # client-side audio
```

## Measurement gate

Before this example may carry latency, delivery, error-rate, concurrency, or rehearsal claims, it needs:

1. a versioned workload and environment definition;
2. instrumented end-to-end event timing with synchronized clock semantics;
3. delivery and error accounting;
4. repeated runs with preserved raw data and summaries;
5. a distinction among local simulation, network test, rehearsal, and live performance;
6. independent review of the measurement procedure.

See `docs/reproducibility/core-engine-evidence-status.md` for the repository-wide claim register.

## License

MIT © Anthony Padavano
