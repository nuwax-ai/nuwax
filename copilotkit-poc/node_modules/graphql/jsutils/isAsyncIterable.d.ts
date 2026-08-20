/**
 * Returns true if the provided object implements the AsyncIterator protocol via
 * implementing a `Symbol.asyncIterator` method.
 *
 * @internal
 */
export declare function isAsyncIterable(
  maybeAsyncIterable: any,
): maybeAsyncIterable is AsyncIterable<unknown>;
