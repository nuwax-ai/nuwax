"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugTimerStart = debugTimerStart;
exports.debugTimerEnd = debugTimerEnd;
const debugNamesOngoing = new Set();
function debugTimerStart(name) {
    const debugEnvVar = globalThis.process?.env?.['DEBUG'] || globalThis.DEBUG;
    if (debugEnvVar === '1' || debugEnvVar?.includes(name)) {
        debugNamesOngoing.add(name);
        console.time(name);
    }
}
function debugTimerEnd(name) {
    if (debugNamesOngoing.has(name)) {
        console.timeEnd(name);
    }
}
