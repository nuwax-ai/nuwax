"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPromise = void 0;
exports.isIterableObject = isIterableObject;
exports.isObjectLike = isObjectLike;
exports.promiseReduce = promiseReduce;
exports.hasOwnProperty = hasOwnProperty;
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
Object.defineProperty(exports, "isPromise", { enumerable: true, get: function () { return promise_helpers_1.isPromise; } });
function isIterableObject(value) {
    return value != null && typeof value === 'object' && Symbol.iterator in value;
}
function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
function promiseReduce(values, callbackFn, initialValue) {
    let accumulator = initialValue;
    for (const value of values) {
        accumulator = (0, promise_helpers_1.handleMaybePromise)(() => accumulator, resolved => callbackFn(resolved, value));
    }
    return accumulator;
}
function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
