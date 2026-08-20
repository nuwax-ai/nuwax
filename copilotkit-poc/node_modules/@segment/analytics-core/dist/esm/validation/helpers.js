export function isString(obj) {
    return typeof obj === 'string';
}
export function isNumber(obj) {
    return typeof obj === 'number';
}
export function isFunction(obj) {
    return typeof obj === 'function';
}
export function exists(val) {
    return val !== undefined && val !== null;
}
export function isPlainObject(obj) {
    return (Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object');
}
//# sourceMappingURL=helpers.js.map