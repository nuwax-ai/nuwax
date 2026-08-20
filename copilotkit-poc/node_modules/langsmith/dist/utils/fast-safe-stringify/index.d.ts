/**
 * Estimate the serialized JSON byte size of a value without actually
 * serializing it. Used on hot paths (enqueuing runs for batched tracing)
 * where the exact serialized size is not required -- only a reasonable
 * approximation for soft memory accounting.
 *
 * Walks the object graph in O(n) without allocating a JSON string,
 * avoiding the event-loop blocking that JSON.stringify causes on large
 * payloads.
 *
 * Accuracy notes (all estimates are approximate, never exact):
 * - Strings: UTF-8 byte length via Buffer.byteLength when available,
 *   falling back to code-unit length for non-Node environments. Does
 *   not account for escape expansion (\", \\, control chars, surrogate
 *   escapes) which is usually a small fraction of total size.
 * - Binary data (Buffer / typed arrays / ArrayBuffer / DataView): sized
 *   from their JSON.stringify representations where practical
 *   ({ type: "Buffer", data: [...] } for Buffer, keyed objects for typed
 *   arrays). DataView and ArrayBuffer themselves have no enumerable own
 *   properties and serialize as "{}". Each byte contributes ~3.5
 *   characters on average in Buffer's decimal-array representation
 *   (digit(s) + comma).
 * - Other objects with toJSON(): we invoke toJSON() once and estimate
 *   the result. This matches JSON.stringify semantics for libraries
 *   like Decimal.js, Moment, Luxon, Mongoose documents, etc.
 * - Cycles: detected via an ancestor-path set that is pushed/popped
 *   during recursion. This matches JSON.stringify semantics --
 *   repeated references that are *not* on the current ancestor chain
 *   (shared subobjects) are counted every time they appear, because
 *   JSON.stringify will serialize them every time.
 * - No depth limit (JSON.stringify has none either).
 */
export interface EstimatedSize {
    /** Approximate serialized JSON byte size. */
    size: number;
    /**
     * Length (in UTF-8 bytes) of the longest single string value encountered
     * anywhere in the payload graph. Callers can use this as a shape-aware
     * dispatch signal -- for example, to decide whether to offload serialize
     * to a worker thread (which only pays off when a payload contains one
     * or more large strings, since V8 shares string storage across isolates
     * via refcount).
     */
    maxStringLen: number;
}
export declare function estimateSerializedSize(value: unknown): EstimatedSize;
export declare function serialize(obj: any, errorContext?: any, replacer?: any, spacer?: any, options?: any): Uint8Array<ArrayBuffer>;
