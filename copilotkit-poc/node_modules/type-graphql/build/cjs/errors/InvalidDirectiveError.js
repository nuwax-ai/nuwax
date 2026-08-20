"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidDirectiveError = void 0;
class InvalidDirectiveError extends Error {
    constructor(msg) {
        super(msg);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.InvalidDirectiveError = InvalidDirectiveError;
