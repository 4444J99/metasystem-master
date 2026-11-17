/**
 * In-process OSC-like message dispatch prototype; not a binary OSC codec.
 *
 * Handles comma-separated numeric message strings, parses structured objects,
 * and dispatches them to registered handlers.
 */

/** Configuration for the OSC receiver. */
export interface OscConfig {
  port: number;
  host: string;
  protocol: "udp" | "tcp";
}

/** A parsed OSC message with address pattern and arguments. */
export interface OscMessage {
  address: string;
  args: OscArgument[];
  timestamp: number;
}

/** An individual OSC argument with type tag. */
export interface OscArgument {
  type: "float" | "int" | "string" | "blob";
  value: number | string | Uint8Array;
}

type MessageHandler = (message: OscMessage) => void;

/** Parses and dispatches in-process messages; it does not open a socket. */
export class OscReceiver {
  private config: OscConfig;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private running = false;

  constructor(config: OscConfig) {
    this.config = config;
  }

  /**
   * Register a handler for a specific OSC address pattern.
   * @param address - The OSC address to listen on (e.g., "/synth/freq").
   * @param handler - Callback invoked when a matching message arrives.
   */
  on(address: string, handler: MessageHandler): void {
    const existing = this.handlers.get(address) ?? [];
    existing.push(handler);
    this.handlers.set(address, existing);
  }

  /**
   * Parse a prototype comma-separated message string (not an OSC packet).
   * @param data - Address followed by comma-separated numeric fields.
   * @returns Parsed OscMessage or null if invalid.
   */
  parse(data: string): OscMessage | null {
    const parts = data.split(",");
    if (parts.length < 1 || !parts[0].startsWith("/")) {
      return null;
    }
    const args: OscArgument[] = parts.slice(1).map((p) => ({
      type: "float" as const,
      value: parseFloat(p) || 0,
    }));
    return {
      address: parts[0],
      args,
      timestamp: Date.now(),
    };
  }

  /**
   * Dispatch an OSC message to all registered handlers for its address.
   * @param message - The parsed message to dispatch.
   * @returns Number of handlers that were invoked.
   */
  dispatch(message: OscMessage): number {
    const handlers = this.handlers.get(message.address) ?? [];
    for (const handler of handlers) {
      handler(message);
    }
    return handlers.length;
  }

  /** Start the receiver (sets running state). */
  start(): void {
    this.running = true;
  }

  /** Stop the receiver. */
  stop(): void {
    this.running = false;
  }

  /** Whether the receiver is currently active. */
  get isRunning(): boolean {
    return this.running;
  }

  /** Return the current configuration. */
  get currentConfig(): OscConfig {
    return { ...this.config };
  }
}
