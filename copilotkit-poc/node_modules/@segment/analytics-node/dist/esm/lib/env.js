export const detectRuntime = () => {
    if (typeof process === 'object' &&
        process &&
        typeof process.env === 'object' &&
        process.env &&
        typeof process.version === 'string') {
        return 'node';
    }
    if (typeof window === 'object') {
        return 'browser';
    }
    // @ts-ignore
    if (typeof WebSocketPair !== 'undefined') {
        return 'cloudflare-worker';
    }
    // @ts-ignore
    if (typeof EdgeRuntime === 'string') {
        return 'vercel-edge';
    }
    if (
    // @ts-ignore
    typeof WorkerGlobalScope !== 'undefined' &&
        // @ts-ignore
        typeof importScripts === 'function') {
        return 'web-worker';
    }
    return 'unknown';
};
//# sourceMappingURL=env.js.map