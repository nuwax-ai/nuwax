import { Collection, Key, Node } from '@react-types/shared';
export declare class TreeCollection<T> implements Collection<Node<T>> {
    private keyMap;
    private iterable;
    private firstKey;
    private lastKey;
    constructor(nodes: Iterable<Node<T>>, { expandedKeys }?: {
        expandedKeys?: Set<Key>;
    });
    [Symbol.iterator](): IterableIterator<Node<T>>;
    get size(): number;
    getKeys(): IterableIterator<Key>;
    getKeyBefore(key: Key): Key | null;
    getKeyAfter(key: Key): Key | null;
    getFirstKey(): Key | null;
    getLastKey(): Key | null;
    getItem(key: Key): Node<T> | null;
    at(idx: number): Node<T> | null;
}
