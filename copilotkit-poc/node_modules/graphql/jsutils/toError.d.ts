/**
 * Sometimes a non-error is thrown, wrap it as an Error instance to ensure a consistent Error interface.
 *
 * @internal
 */
export declare function toError(thrownValue: unknown): Error;
