/**
 * Omni-Dromenon legacy example: generative music.
 *
 * This standalone proof-of-concept implements Socket.IO input collection,
 * temporal/proximity aggregation, performer override state, and periodic state
 * broadcast. It asserts no validated latency, delivery, concurrency, rehearsal,
 * or live-performance result.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 10_000,
  pingTimeout: 5_000,
});

app.use(express.static(path.join(__dirname, '../public')));

const CONFIG = {
  INPUT_DECAY_WINDOW_MS: 5_000,
  STATE_BROADCAST_INTERVAL_MS: 50,
  CONSENSUS_SMOOTHING: 0.15,
  BETA_TEMPORAL: 0.6,
  GAMMA_CONSENSUS: 0.4,
};

const performanceState = {
  mood: 0.5,
  tempo: 0.5,
  intensity: 0.5,
  density: 0.5,
  lastUpdate: Date.now(),
  updateSource: 'init',
  audienceCount: 0,
  overrides: {
    active: false,
    mood: null,
    tempo: null,
    intensity: null,
    density: null,
  },
};

const audienceInputs = new Map();

function calculateWeightedConsensus() {
  const now = Date.now();
  const inputs = Array.from(audienceInputs.values());
  if (inputs.length === 0) return null;

  const parameters = ['mood', 'tempo', 'intensity', 'density'];
  const result = {};

  parameters.forEach((parameter) => {
    let weightedSum = 0;
    let totalWeight = 0;

    inputs.forEach((input) => {
      if (input.values[parameter] === undefined) return;

      const age = now - input.timestamp;
      if (age > CONFIG.INPUT_DECAY_WINDOW_MS) return;

      const temporalWeight = Math.exp(
        (-age / CONFIG.INPUT_DECAY_WINDOW_MS) * CONFIG.BETA_TEMPORAL,
      );
      const currentValue = performanceState[parameter];
      const inputValue = input.values[parameter];
      const distance = Math.abs(inputValue - currentValue);
      const consensusWeight = 1 - distance * CONFIG.GAMMA_CONSENSUS;
      const finalWeight = temporalWeight * Math.max(0.1, consensusWeight);

      weightedSum += inputValue * finalWeight;
      totalWeight += finalWeight;
    });

    if (totalWeight > 0) {
      result[parameter] = weightedSum / totalWeight;
    }
  });

  return Object.keys(result).length > 0 ? result : null;
}

function applyConsensus(consensus) {
  if (!consensus) return;

  Object.entries(consensus).forEach(([parameter, value]) => {
    if (
      performanceState.overrides.active
      && performanceState.overrides[parameter] !== null
    ) {
      return;
    }

    const current = performanceState[parameter];
    performanceState[parameter] = current
      + (value - current) * CONFIG.CONSENSUS_SMOOTHING;
  });

  performanceState.lastUpdate = Date.now();
  performanceState.updateSource = 'consensus';
}

function pruneOldInputs() {
  const now = Date.now();
  for (const [userId, input] of audienceInputs.entries()) {
    if (now - input.timestamp > CONFIG.INPUT_DECAY_WINDOW_MS * 2) {
      audienceInputs.delete(userId);
    }
  }
}

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);

  socket.on('audience:input', (data) => {
    const { values, timestamp } = data;
    audienceInputs.set(socket.id, {
      timestamp: timestamp || Date.now(),
      values,
    });

    // This acknowledgement exposes timestamps for later measurement work. It
    // is not by itself an end-to-end latency measurement.
    socket.emit('input:ack', {
      timestamp: data.timestamp,
      serverTime: Date.now(),
    });
  });

  socket.on('performer:override', (data) => {
    const { param, value, active } = data;

    if (active !== undefined) {
      performanceState.overrides.active = active;
    }

    if (param && value !== undefined) {
      performanceState.overrides[param] = value;
      performanceState[param] = value;
      performanceState.lastUpdate = Date.now();
      performanceState.updateSource = 'performer';
    }

    console.log(
      `[PERFORMER] Override: ${param} = ${value} (active: ${performanceState.overrides.active})`,
    );
  });

  socket.on('disconnect', () => {
    audienceInputs.delete(socket.id);
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
  });
});

setInterval(() => {
  pruneOldInputs();
  applyConsensus(calculateWeightedConsensus());

  performanceState.audienceCount = audienceInputs.size;
  io.emit('state:update', {
    mood: performanceState.mood,
    tempo: performanceState.tempo,
    intensity: performanceState.intensity,
    density: performanceState.density,
    audienceCount: performanceState.audienceCount,
    timestamp: Date.now(),
    source: performanceState.updateSource,
  });
}, CONFIG.STATE_BROADCAST_INTERVAL_MS);

app.get('/health', (request, response) => {
  response.json({ status: 'ok', audienceCount: audienceInputs.size });
});

app.get('/state', (request, response) => {
  response.json(performanceState);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Omni-Dromenon generative-music example listening on port ${PORT}`);
  console.log(`Audience:  http://localhost:${PORT}`);
  console.log(`Performer: http://localhost:${PORT}/performer.html`);
  console.log(`Health:    http://localhost:${PORT}/health`);
  console.log('No performance or deployment validation is asserted by startup.');
});
