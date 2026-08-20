/* eslint-disable @typescript-eslint/no-empty-object-type */
import { LRUCache as LRU } from 'lru-cache';
/**
 * @deprecated In the next major, `createLRUCache` will be renamed to `_createLRUCache`,
 * and the current `createLRUCache` will be removed.
 */
export const createLRUCache = _createLRUCache;
const DEFAULT_MAX = 1024;
const DEFAULT_TTL = 3_600_000;
/**
 * @internal This is an internal utility, and you should use it with your own risk.
 * This utility can have breaking changes in the future.
 */
export function _createLRUCache({ max = DEFAULT_MAX, ttl = DEFAULT_TTL, } = {}) {
    return new LRU({ max, ttl });
}
