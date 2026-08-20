import { handleMaybePromise, isPromise } from '@whatwg-node/promise-helpers';
export function isIterableObject(value) {
    return value != null && typeof value === 'object' && Symbol.iterator in value;
}
export function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
export { isPromise };
export function promiseReduce(values, callbackFn, initialValue) {
    let accumulator = initialValue;
    for (const value of values) {
        accumulator = handleMaybePromise(() => accumulator, resolved => callbackFn(resolved, value));
    }
    return accumulator;
}
export function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
