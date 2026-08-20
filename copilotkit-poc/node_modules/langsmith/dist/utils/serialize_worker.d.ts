/**
 * Off-thread serialization using Node worker_threads.
 *
 * Falls back silently to synchronous serialize() when:
 *   - worker_threads is unavailable (browsers, Deno, Bun without compat,
 *     Cloudflare Workers, Vercel Edge, React Native)
 *   - the worker cannot be constructed (bundler/runtime constraints)
 *   - DataCloneError is thrown for a payload containing non-cloneable
 *     values (functions, class instances with non-cloneable state, etc.)
 *   - the worker crashes or throws
 *
 * Protocol:
 *   main -> worker: { id, op, payload }
 *     op = "serialize" -> worker returns bytes as a transferable ArrayBuffer
 *   worker -> main: { id, bytes?: ArrayBuffer, error?: string }
 *
 * The worker source is inlined as a string so the library bundles cleanly
 * under webpack/esbuild/ncc without requiring a separate asset file.
 */
export declare class SerializeWorker {
    private worker;
    private nextId;
    private pending;
    private disabled;
    private startPromise;
    /**
     * Try to construct the worker. Returns false if the runtime can't support
     * it -- in that case callers must fall back to synchronous serialization.
     * Kept async so callers don't have to branch on runtime -- the promise
     * resolves synchronously on the microtask queue when the worker module
     * is available, which is the common Node CJS/ESM path.
     */
    private ensureStarted;
    private _start;
    /**
     * Serialize a payload off-thread. Rejects with DataCloneError (or similar)
     * if the payload contains non-cloneable values -- callers must catch and
     * fall back to synchronous serialize().
     *
     * Resolves with null if the worker subsystem is unavailable entirely,
     * so the caller can fall back without paying try/catch overhead.
     */
    serialize(payload: unknown): Promise<Uint8Array<ArrayBuffer> | null>;
    terminate(): Promise<void>;
}
/**
 * Process-wide shared worker. One worker serves all Client instances to
 * avoid spawning multiple threads per process.
 */
export declare function getSharedSerializeWorker(): SerializeWorker;
/**
 * Cheap, short-circuiting walk that returns true iff the payload contains
 * at least one string of length >= threshold anywhere in its graph.
 *
 * - Terminates immediately on the first qualifying string.
 * - Caps total nodes visited at `nodeBudget` so cost is bounded for huge
 *   structural payloads.
 * - Avoids allocation in the common path: uses an array as a stack and a
 *   Set only for cycle detection.
 * - Uses `string.length` (UTF-16 units), not UTF-8 byte length, because
 *   that's what V8's string-sharing fast path keys on and because it's
 *   an O(1) property access. For ASCII content this is identical to the
 *   UTF-8 byte count; for non-ASCII text the two differ by at most 4x,
 *   well within the safety margin of the threshold.
 */
export declare function hasLargeString(value: unknown, threshold?: number, nodeBudget?: number): boolean;
