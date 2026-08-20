export const useEnvelop = (envelop) => {
    let initialized = false;
    return {
        onPluginInit({ addPlugin }) {
            if (initialized) {
                return;
            }
            for (const plugin of envelop._plugins) {
                addPlugin(plugin);
            }
            // Avoid double execution if envelop is extended multiple times
            initialized = true;
        },
    };
};
