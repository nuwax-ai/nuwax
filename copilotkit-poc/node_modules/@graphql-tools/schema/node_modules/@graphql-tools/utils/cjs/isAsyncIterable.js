"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAsyncIterable = isAsyncIterable;
function isAsyncIterable(value) {
    return value?.[Symbol.asyncIterator] != null;
}
