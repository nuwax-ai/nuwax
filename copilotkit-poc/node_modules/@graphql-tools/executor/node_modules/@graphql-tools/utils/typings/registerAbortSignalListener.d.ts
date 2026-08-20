/**
 * Register an AbortSignal handler for a signal.
 * This helper function mainly exists to work around the
 * "possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit."
 * warning occuring on Node.js
 */
export declare function registerAbortSignalListener(signal: AbortSignal, listener: () => void): void;
export declare const getAbortPromise: (signal: AbortSignal) => Promise<unknown>;
