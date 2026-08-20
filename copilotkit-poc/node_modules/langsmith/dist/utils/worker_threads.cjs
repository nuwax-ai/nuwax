"use strict";
/**
 * worker_threads abstraction (Node.js version).
 *
 * This file is swapped with worker_threads.browser.ts for browser / edge
 * builds via the package.json `browser` field. Node gets the real module;
 * browsers get a stub that signals unavailability.
 *
 * Only the surface actually used by SerializeWorker is re-exported.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKER_THREADS_AVAILABLE = exports.Worker = void 0;
// eslint-disable-next-line import/no-unresolved
const node_worker_threads_1 = require("node:worker_threads");
exports.Worker = node_worker_threads_1.Worker;
exports.WORKER_THREADS_AVAILABLE = true;
