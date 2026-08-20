/**
 * Groups array items into a Map, given a function to produce grouping key.
 *
 * @internal
 */
export declare function groupBy<K, T>(
  list: ReadonlyArray<T>,
  keyFn: (item: T) => K,
): Map<K, ReadonlyArray<T>>;
