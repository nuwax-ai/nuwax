"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolKeysNotSupportedError = void 0;
class SymbolKeysNotSupportedError extends Error {
    constructor() {
        super("Symbol keys are not supported yet!");
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.SymbolKeysNotSupportedError = SymbolKeysNotSupportedError;
