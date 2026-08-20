import { MutableRefObject, Ref } from 'react';
/**
 * Merges multiple refs into one. Works with either callback or object refs.
 */
export declare function mergeRefs<T>(...refs: Array<Ref<T> | MutableRefObject<T> | null | undefined>): Ref<T>;
