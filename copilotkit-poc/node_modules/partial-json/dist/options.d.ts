/**
 * Sometimes you don't allow every type to be partially parsed.
 * For example, you may not want a partial number because it may increase its size gradually before it's complete.
 * In this case, you can use the `Allow` object to control what types you allow to be partially parsed.
 * @module
 */
/**
 * allow partial strings like `"hello \u12` to be parsed as `"hello "`
 */
export declare const STR = 1;
/**
 * allow partial numbers like `123.` to be parsed as `123`
 */
export declare const NUM = 2;
/**
 * allow partial arrays like `[1, 2,` to be parsed as `[1, 2]`
 */
export declare const ARR = 4;
/**
 * allow partial objects like `{"a": 1, "b":` to be parsed as `{"a": 1}`
 */
export declare const OBJ = 8;
/**
 * allow `nu` to be parsed as `null`
 */
export declare const NULL = 16;
/**
 * allow `tr` to be parsed as `true`, and `fa` to be parsed as `false`
 */
export declare const BOOL = 32;
/**
 * allow `Na` to be parsed as `NaN`
 */
export declare const NAN = 64;
/**
 * allow `Inf` to be parsed as `Infinity`
 */
export declare const INFINITY = 128;
/**
 * allow `-Inf` to be parsed as `-Infinity`
 */
export declare const _INFINITY = 256;
export declare const INF: number;
export declare const SPECIAL: number;
export declare const ATOM: number;
export declare const COLLECTION: number;
export declare const ALL: number;
/**
 * Control what types you allow to be partially parsed.
 * The default is to allow all types to be partially parsed, which in most casees is the best option.
 * @example
 * If you don't want to allow partial objects, you can use the following code:
 * ```ts
 * import { Allow, parse } from "partial-json";
 * parse(`[{"a": 1, "b": 2}, {"a": 3,`, Allow.ARR); // [ { a: 1, b: 2 } ]
 * ```
 * Or you can use `~` to disallow a type:
 * ```ts
 * parse(`[{"a": 1, "b": 2}, {"a": 3,`, ~Allow.OBJ); // [ { a: 1, b: 2 } ]
 * ```
 * @example
 * If you don't want to allow partial strings, you can use the following code:
 * ```ts
 * import { Allow, parse } from "partial-json";
 * parse(`["complete string", "incompl`, ~Allow.STR); // [ 'complete string' ]
 * ```
 */
export declare const Allow: {
    STR: number;
    NUM: number;
    ARR: number;
    OBJ: number;
    NULL: number;
    BOOL: number;
    NAN: number;
    INFINITY: number;
    _INFINITY: number;
    INF: number;
    SPECIAL: number;
    ATOM: number;
    COLLECTION: number;
    ALL: number;
};
export default Allow;
//# sourceMappingURL=options.d.ts.map