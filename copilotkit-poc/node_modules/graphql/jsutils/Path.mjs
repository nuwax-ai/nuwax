/** @category Paths */

/** Represents a linked response path from a field back to the root response. */

/**
 * Given a Path and a key, return a new Path containing the new key.
 *
 * @internal
 */
export function addPath(prev, key, typename) {
  return {
    prev,
    key,
    typename,
  };
}
/**
 * Given a Path, return an Array of the path keys.
 * @param path - The linked response path to flatten.
 * @returns An array of response path keys from root to leaf.
 * @example
 * ```ts
 * import { pathToArray } from 'graphql/jsutils/Path';
 *
 * const path = {
 *   prev: {
 *     prev: {
 *       prev: undefined,
 *       key: 'viewer',
 *       typename: 'Query',
 *     },
 *     key: 'friends',
 *     typename: 'User',
 *   },
 *   key: 0,
 *   typename: undefined,
 * };
 *
 * pathToArray(path); // => ['viewer', 'friends', 0]
 * pathToArray(undefined); // => []
 * ```
 */

export function pathToArray(path) {
  const flattened = [];
  let curr = path;

  while (curr) {
    flattened.push(curr.key);
    curr = curr.prev;
  }

  return flattened.reverse();
}
