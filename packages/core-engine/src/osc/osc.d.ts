/**
 * Narrow declarations for the osc.js 2.4.5 API used by this bridge.
 * Checked against the locked package's src/osc.js and src/platforms/osc-node.js.
 * This does not declare unused transports or establish network behavior.
 * Metadata values remain unknown until the caller checks their runtime type.
 */
declare module 'osc' {
  namespace osc {
    interface MetadataArgument { type: string; value?: unknown; }
    type Argument = MetadataArgument | Argument[];
    interface OscMessage { address: string; args: Argument | Argument[]; }
    interface TimeTag { raw: [number, number]; native?: number; }
    interface OscBundle { timeTag: TimeTag; packets: Array<OscMessage | OscBundle>; }
    interface CodecOptions { metadata: true; unpackSingleArgs?: boolean; }
    interface UDPPortOptions extends CodecOptions {
      localAddress: string; localPort: number;
      remoteAddress: string; remotePort: number;
    }
    class UDPPort {
      constructor(options: UDPPortOptions);
      on(event: 'ready', listener: () => void): this;
      on(event: 'message', listener: (message: OscMessage) => void): this;
      on(event: 'error', listener: (error: Error) => void): this;
      emit(event: 'ready'): boolean;
      emit(event: 'message', message: OscMessage): boolean;
      open(): void;
      close(): void;
      send(packet: OscMessage | OscBundle): void;
    }
    function timeTag(seconds: number, now?: number): TimeTag;
    function writeMessage(message: OscMessage, options: CodecOptions): Uint8Array;
    function readMessage(data: Uint8Array, options: CodecOptions): OscMessage;
  }
  export = osc;
}
