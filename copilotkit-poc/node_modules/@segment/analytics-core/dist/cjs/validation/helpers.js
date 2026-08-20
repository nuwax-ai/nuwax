"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlainObject = exports.exists = exports.isFunction = exports.isNumber = exports.isString = void 0;
function isString(obj) {
    return typeof obj === 'string';
}
exports.isString = isString;
function isNumber(obj) {
    return typeof obj === 'number';
}
exports.isNumber = isNumber;
function isFunction(obj) {
    return typeof obj === 'function';
}
exports.isFunction = isFunction;
function exists(val) {
    return val !== undefined && val !== null;
}
exports.exists = exists;
function isPlainObject(obj) {
    return (Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object');
}
exports.isPlainObject = isPlainObject;
//# sourceMappingURL=helpers.js.map