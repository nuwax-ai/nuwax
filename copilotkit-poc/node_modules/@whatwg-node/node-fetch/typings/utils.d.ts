import { Readable, Writable } from 'node:stream';
import { PonyfillCompressionFormat } from './CompressionStream';
export declare function getHeadersObj(headers: Headers): Record<string, string>;
export declare function defaultHeadersSerializer(headers: Headers, onContentLength?: (value: string) => void): string[];
export { fakePromise } from '@whatwg-node/promise-helpers';
export declare function isArrayBufferView(obj: any): obj is ArrayBufferView;
export declare function isNodeReadable(obj: any): obj is Readable;
export declare function isIterable(value: any): value is Iterable<unknown>;
export declare function shouldRedirect(status?: number): boolean;
export declare function pipeThrough({ src, dest, signal, onError, }: {
    src: Readable;
    dest: Writable;
    signal?: AbortSignal | undefined;
    onError?: ((e: Error) => void) | undefined;
}): void;
export declare function endStream(stream: {
    end: (...args: any[]) => void;
}): void;
export declare function safeWrite<TWritable extends Writable>(chunk: Parameters<TWritable['write']>[0], stream: TWritable): Promise<any[]> | undefined;
export declare const DEFAULT_ACCEPT_ENCODING: string;
export declare function getSupportedFormats(): PonyfillCompressionFormat[];
