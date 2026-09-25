/**
 * In-process OSC-like message and synthesis-voice state prototype.
 * No network sockets or browser AudioContext are created by this package.
 * Recovered from organvm/audio-synthesis-bridge; see README.md for provenance.
 */
export { OscReceiver } from "./osc.js";
export { WebAudioEngine, SynthVoice } from "./webaudio.js";
export type { OscConfig, OscMessage, OscArgument } from "./osc.js";
export type { EngineConfig, VoiceParams } from "./webaudio.js";
