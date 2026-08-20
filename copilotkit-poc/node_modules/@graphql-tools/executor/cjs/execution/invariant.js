"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invariant = invariant;
function invariant(condition, message) {
    if (!condition) {
        throw new Error(message != null ? message : 'Unexpected invariant triggered.');
    }
}
