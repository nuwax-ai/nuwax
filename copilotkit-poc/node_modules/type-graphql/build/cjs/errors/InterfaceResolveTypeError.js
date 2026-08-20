"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceResolveTypeError = void 0;
class InterfaceResolveTypeError extends Error {
    constructor(interfaceMetadata) {
        super(`Cannot resolve type for interface ${interfaceMetadata.name}! ` +
            `You need to return instance of object type class, not a plain object!`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.InterfaceResolveTypeError = InterfaceResolveTypeError;
