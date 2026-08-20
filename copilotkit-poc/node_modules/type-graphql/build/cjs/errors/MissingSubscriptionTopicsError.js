"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingSubscriptionTopicsError = void 0;
class MissingSubscriptionTopicsError extends Error {
    constructor(target, methodName) {
        super(`${target.name}#${methodName} subscription has no provided topics!`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.MissingSubscriptionTopicsError = MissingSubscriptionTopicsError;
