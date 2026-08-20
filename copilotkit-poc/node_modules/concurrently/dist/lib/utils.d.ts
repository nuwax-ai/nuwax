/**
 * Escapes a string for use in a regular expression.
 */
export declare function escapeRegExp(str: string): string;
type CastArrayResult<T> = T extends undefined | null ? never[] : T extends unknown[] ? T : T[];
/**
 * Casts a value to an array if it's not one.
 */
export declare function castArray<T = never[]>(value?: T): CastArrayResult<T>;
/**
 * Splits a string on `delimiter`, ignoring delimiters inside parentheses.
 * Trims each segment and discards empty ones.
 *
 * Examples:
 *   splitOutsideParens('red,rgb(255,0,0),blue', ',') → ['red', 'rgb(255,0,0)', 'blue']
 *   splitOutsideParens('black.bgHex(#533AFD).dim', '.') → ['black', 'bgHex(#533AFD)', 'dim']
 */
export declare function splitOutsideParens(input: string, delimiter: string): string[];
/**
 * Error thrown when a condition is reached that should be impossible.
 */
export declare class UnreachableError extends Error {
    constructor(value: never);
}
export {};
