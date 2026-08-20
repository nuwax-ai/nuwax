import { Key } from '@react-types/shared';
/**
 * A Selection is a special Set containing Keys, which also has an anchor
 * and current selected key for use when range selecting.
 */
export declare class Selection extends Set<Key> {
    anchorKey: Key | null;
    currentKey: Key | null;
    constructor(keys?: Iterable<Key> | Selection, anchorKey?: Key | null, currentKey?: Key | null);
}
