const deprecations = new Set();
/**
 * Asserts that some condition is true, and if not, prints a warning about it being deprecated.
 * The message is printed only once.
 */
export function assertDeprecated(check, name, message) {
    if (!check && !deprecations.has(name)) {
        // eslint-disable-next-line no-console
        console.warn(`[concurrently] ${name} is deprecated. ${message}`);
        deprecations.add(name);
    }
}
const runtimes = new Set();
/**
 * Asserts that some condition is true, and if not, prints a warning about the runtime not being well supported.
 * The message is printed only once.
 */
export function assertNotRuntime(check, name, message) {
    if (!check && !runtimes.has(name)) {
        // eslint-disable-next-line no-console
        console.warn(`[concurrently] Running via ${name} is not well supported. ${message}`);
        runtimes.add(name);
    }
}
