"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.debugPrefix = exports.errorPrefix = exports.infoPrefix = exports.warnPrefix = void 0;
const ansiCodes = {
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
};
exports.warnPrefix = ansiCodes.yellow + 'WARN' + ansiCodes.reset;
exports.infoPrefix = ansiCodes.cyan + 'INFO' + ansiCodes.reset;
exports.errorPrefix = ansiCodes.red + 'ERR' + ansiCodes.reset;
exports.debugPrefix = ansiCodes.magenta + 'DEBUG' + ansiCodes.reset;
const logLevelScores = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4,
};
const noop = () => { };
const consoleLog = (prefix) => (...args) => console.log(prefix, ...args);
const debugLog = console.debug
    ? (...args) => console.debug(exports.debugPrefix, ...args)
    : consoleLog(exports.debugPrefix);
const infoLog = console.info
    ? (...args) => console.info(exports.infoPrefix, ...args)
    : consoleLog(exports.infoPrefix);
const warnLog = console.warn
    ? (...args) => console.warn(exports.warnPrefix, ...args)
    : consoleLog(exports.warnPrefix);
const errorLog = console.error
    ? (...args) => console.error(exports.errorPrefix, ...args)
    : consoleLog(exports.errorPrefix);
const createLogger = (logLevel = globalThis.process?.env['DEBUG'] === '1' ? 'debug' : 'info') => {
    const score = logLevelScores[logLevel];
    return {
        debug: score > logLevelScores.debug ? noop : debugLog,
        info: score > logLevelScores.info ? noop : infoLog,
        warn: score > logLevelScores.warn ? noop : warnLog,
        error: score > logLevelScores.error ? noop : errorLog,
    };
};
exports.createLogger = createLogger;
