/** Typed subset consumed by the bridge, checked against osc 2.4.5 source.
 * metadata: true is required; this is not a declaration of the entire OSC API.
 */
declare module 'osc' {
  import { EventEmitter } from 'node:events';
  export interface TimeTag { raw: [number, number]; native?: number }
  export type Argument =
    | { type: 'i' | 'f' | 'd'; value: number }
    | { type: 's' | 'S' | 'c'; value: string }
    | { type: 'b' | 'm'; value: Uint8Array }
    | { type: 't'; value: TimeTag }
    | { type: 'h'; value: { low: number; high: number; unsigned?: boolean } }
    | { type: 'r'; value: { r: number; g: number; b: number; a: number } }
    | { type: 'T' | 'F' | 'N' | 'I'; value?: boolean | null | number };
  export interface OscMessage { address: string; args: Argument[] }
  export interface OscBundle { timeTag: TimeTag; packets: (OscMessage | OscBundle)[] }
  export class UDPPort extends EventEmitter {
    constructor(options: {
      localAddress: string; localPort: number;
      remoteAddress: string; remotePort: number; metadata: true;
    });
    open(): void;
    close(): void;
    send(packet: OscMessage | OscBundle): void;
  }
  export function timeTag(seconds: number, now?: number): TimeTag;
}
