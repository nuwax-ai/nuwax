"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abortSignalAfterTimeout = exports.AbortController = exports.AbortSignal = void 0;
/**
 * use non-native event emitter for the benefit of non-node runtimes like CF workers.
 */
const analytics_generic_utils_1 = require("@segment/analytics-generic-utils");
const env_1 = require("./env");
/**
 * adapted from: https://www.npmjs.com/package/node-abort-controller
 */
class AbortSignal {
    onabort = null;
    aborted = false;
    eventEmitter = new analytics_generic_utils_1.Emitter();
    toString() {
        return '[object AbortSignal]';
    }
    get [Symbol.toStringTag]() {
        return 'AbortSignal';
    }
    removeEventListener(...args) {
        this.eventEmitter.off(...args);
    }
    addEventListener(...args) {
        this.eventEmitter.on(...args);
    }
    dispatchEvent(type) {
        const event = { type, target: this };
        const handlerName = `on${type}`;
        if (typeof this[handlerName] === 'function') {
            ;
            this[handlerName](event);
        }
        this.eventEmitter.emit(type, event);
    }
}
exports.AbortSignal = AbortSignal;
/**
 * This polyfill is only neccessary to support versions of node < 14.17.
 * Can be removed once node 14 support is dropped.
 */
class AbortController {
    signal = new AbortSignal();
    abort() {
        if (this.signal.aborted)
            return;
        this.signal.aborted = true;
        this.signal.dispatchEvent('abort');
    }
    toString() {
        return '[object AbortController]';
    }
    get [Symbol.toStringTag]() {
        return 'AbortController';
    }
}
exports.AbortController = AbortController;
/**
 * @param timeoutMs - Set a request timeout, after which the request is cancelled.
 */
const abortSignalAfterTimeout = (timeoutMs) => {
    if ((0, env_1.detectRuntime)() === 'cloudflare-worker') {
        return []; // TODO: this is broken in cloudflare workers, otherwise results in "A hanging Promise was canceled..." error.
    }
    const ac = new (globalThis.AbortController || AbortController)();
    const timeoutId = setTimeout(() => {
        ac.abort();
    }, timeoutMs);
    // Allow Node.js processes to exit early if only the timeout is running
    timeoutId?.unref?.();
    return [ac.signal, timeoutId];
};
exports.abortSignalAfterTimeout = abortSignalAfterTimeout;
//# sourceMappingURL=abort.js.map