/**
 * Asserts that some condition is true, and if not, prints a warning about it being deprecated.
 * The message is printed only once.
 */
export declare function assertDeprecated(check: boolean, name: string, message: string): void;
/**
 * Asserts that some condition is true, and if not, prints a warning about the runtime not being well supported.
 * The message is printed only once.
 */
export declare function assertNotRuntime(check: boolean, name: string, message: string): void;
