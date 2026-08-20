export const fetch = async (...args) => {
    if (globalThis.fetch) {
        return globalThis.fetch(...args);
    }
    // This guard causes is important, as it causes dead-code elimination to be enabled inside this block.
    // @ts-ignore
    else if (typeof EdgeRuntime !== 'string') {
        return (await import('node-fetch')).default(...args);
    }
    else {
        throw new Error('Invariant: an edge runtime that does not support fetch should not exist');
    }
};
//# sourceMappingURL=fetch.js.map