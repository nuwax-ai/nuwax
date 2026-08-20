import { handleMaybePromise, isPromise } from '@whatwg-node/promise-helpers';
/**
 * Composes 2 instrumentations together into one instrumentation.
 * The first one will be the outer call, the second one the inner call.
 */
export function chain(first, next) {
    const merged = { ...next, ...first };
    for (const key of Object.keys(merged)) {
        if (key in first && key in next) {
            merged[key] = (payload, wrapped) => first[key](payload, () => next[key](payload, wrapped));
        }
    }
    return merged;
}
/**
 * Composes a list of instrumentation together into one instrumentation object.
 * The order of execution will respect the order of the array,
 * the first one being the outter most call, the last one the inner most call.
 */
export function composeInstrumentation(instrumentation) {
    return instrumentation.length > 0 ? instrumentation.reduce(chain) : undefined;
}
/**
 * Extract instrumentation from a list of plugins.
 * It returns instrumentation found, and the list of plugins without their instrumentation.
 *
 * You can use this to easily customize the composition of the instrumentation if the default one
 * doesn't suits your needs.
 */
export function getInstrumentationAndPlugin(plugins) {
    const pluginInstrumentation = [];
    const newPlugins = [];
    for (const { instrumentation, ...plugin } of plugins) {
        if (instrumentation) {
            pluginInstrumentation.push(instrumentation);
        }
        newPlugins.push(plugin);
    }
    return { pluginInstrumentation, plugins: newPlugins };
}
/**
 * A helper to instrument a function.
 *
 * @param payload: The first argument that will be passed to the instrumentation on each function call
 * @returns Function and Async Functions factories allowing to wrap a function with a given instrument.
 */
export const getInstrumented = (payload) => ({
    /**
     * Wraps the `wrapped` function with the given `instrument` wrapper.
     * @returns The wrapped function, or `undefined` if the instrument is `undefined`.
     */
    fn(instrument, wrapped) {
        if (!instrument) {
            return wrapped;
        }
        return (...args) => {
            let result;
            instrument(payload, () => {
                result = wrapped(...args);
            });
            return result;
        };
    },
    /**
     * Wraps the `wrapped` function with the given `instrument` wrapper.
     * @returns The wrapped function, or `undefined` if the instrument is `undefined`.
     */
    asyncFn(instrument, wrapped) {
        if (!instrument) {
            return wrapped;
        }
        return (...args) => {
            let result;
            return handleMaybePromise(() => instrument(payload, () => {
                result = wrapped(...args);
                return isPromise(result) ? result.then(() => undefined) : undefined;
            }), () => {
                return result;
            });
        };
    },
});
