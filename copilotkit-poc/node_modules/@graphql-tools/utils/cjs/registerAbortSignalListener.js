"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbortPromise = void 0;
exports.registerAbortSignalListener = registerAbortSignalListener;
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const memoize_js_1 = require("./memoize.js");
// AbortSignal handler cache to avoid the "possible EventEmitter memory leak detected"
// on Node.js
const getListenersOfAbortSignal = (0, memoize_js_1.memoize1)(function getListenersOfAbortSignal(signal) {
    const listeners = new Set();
    signal.addEventListener('abort', e => {
        for (const listener of listeners) {
            listener(e);
        }
    }, { once: true });
    return listeners;
});
/**
 * Register an AbortSignal handler for a signal.
 * This helper function mainly exists to work around the
 * "possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit."
 * warning occuring on Node.js
 */
function registerAbortSignalListener(signal, listener) {
    // If the signal is already aborted, call the listener immediately
    if (signal.aborted) {
        listener();
        return;
    }
    getListenersOfAbortSignal(signal).add(listener);
}
exports.getAbortPromise = (0, memoize_js_1.memoize1)(function getAbortPromise(signal) {
    // If the signal is already aborted, return a rejected promise
    if (signal.aborted) {
        return (0, promise_helpers_1.fakeRejectPromise)(signal.reason);
    }
    return new Promise((_resolve, reject) => {
        if (signal.aborted) {
            reject(signal.reason);
            return;
        }
        registerAbortSignalListener(signal, () => {
            reject(signal.reason);
        });
    });
});
