"use strict";
/**
 * worker_threads abstraction (browser / edge stub).
 *
 * Selected in browser / edge builds via the package.json `browser` field.
 * Worker is null and WORKER_THREADS_AVAILABLE is false, so callers can
 * bail out at construction time without referencing `node:worker_threads`.
 *
 * Intentionally does not import `node:worker_threads` -- bundlers that
 * honor the browser field will never traverse the Node variant, so this
 * file is what determines the browser-bundle surface.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKER_THREADS_AVAILABLE = exports.Worker = void 0;
exports.Worker = null;
exports.WORKER_THREADS_AVAILABLE = false;
