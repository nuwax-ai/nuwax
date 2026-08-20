"use strict";
/**
 * Sometimes you don't allow every type to be partially parsed.
 * For example, you may not want a partial number because it may increase its size gradually before it's complete.
 * In this case, you can use the `Allow` object to control what types you allow to be partially parsed.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Allow = exports.ALL = exports.COLLECTION = exports.ATOM = exports.SPECIAL = exports.INF = exports._INFINITY = exports.INFINITY = exports.NAN = exports.BOOL = exports.NULL = exports.OBJ = exports.ARR = exports.NUM = exports.STR = void 0;
/**
 * allow partial strings like `"hello \u12` to be parsed as `"hello "`
 */
exports.STR = 0b000000001;
/**
 * allow partial numbers like `123.` to be parsed as `123`
 */
exports.NUM = 0b000000010;
/**
 * allow partial arrays like `[1, 2,` to be parsed as `[1, 2]`
 */
exports.ARR = 0b000000100;
/**
 * allow partial objects like `{"a": 1, "b":` to be parsed as `{"a": 1}`
 */
exports.OBJ = 0b000001000;
/**
 * allow `nu` to be parsed as `null`
 */
exports.NULL = 0b000010000;
/**
 * allow `tr` to be parsed as `true`, and `fa` to be parsed as `false`
 */
exports.BOOL = 0b000100000;
/**
 * allow `Na` to be parsed as `NaN`
 */
exports.NAN = 0b001000000;
/**
 * allow `Inf` to be parsed as `Infinity`
 */
exports.INFINITY = 0b010000000;
/**
 * allow `-Inf` to be parsed as `-Infinity`
 */
exports._INFINITY = 0b100000000;
exports.INF = exports.INFINITY | exports._INFINITY;
exports.SPECIAL = exports.NULL | exports.BOOL | exports.INF | exports.NAN;
exports.ATOM = exports.STR | exports.NUM | exports.SPECIAL;
exports.COLLECTION = exports.ARR | exports.OBJ;
exports.ALL = exports.ATOM | exports.COLLECTION;
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
exports.Allow = { STR: exports.STR, NUM: exports.NUM, ARR: exports.ARR, OBJ: exports.OBJ, NULL: exports.NULL, BOOL: exports.BOOL, NAN: exports.NAN, INFINITY: exports.INFINITY, _INFINITY: exports._INFINITY, INF: exports.INF, SPECIAL: exports.SPECIAL, ATOM: exports.ATOM, COLLECTION: exports.COLLECTION, ALL: exports.ALL };
exports.default = exports.Allow;
