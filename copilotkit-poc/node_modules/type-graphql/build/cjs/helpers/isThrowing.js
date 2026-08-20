"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isThrowing = void 0;
function isThrowing(fn) {
    try {
        fn();
        return false;
    }
    catch {
        return true;
    }
}
exports.isThrowing = isThrowing;
