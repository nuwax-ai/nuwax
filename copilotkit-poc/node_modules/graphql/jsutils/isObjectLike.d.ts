/**
 * Return true if `value` is object-like. A value is object-like if it's not
 * `null` and has a `typeof` result of "object".
 *
 * @internal
 */
export declare function isObjectLike(value: unknown): value is {
  [key: string]: unknown;
};
