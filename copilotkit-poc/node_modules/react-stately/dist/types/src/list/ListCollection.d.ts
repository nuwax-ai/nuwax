import { Collection, Key, Node } from '@react-types/shared';
export declare class ListCollection<T> implements Collection<Node<T>> {
    private keyMap;
    private iterable;
    private firstKey;
    private lastKey;
    private _size;
    constructor(nodes: Iterable<Node<T>>);
    [Symbol.iterator](): IterableIterator<Node<T>>;
    get size(): number;
    getKeys(): IterableIterator<Key>;
    getKeyBefore(key: Key): Key | null;
    getKeyAfter(key: Key): Key | null;
    getFirstKey(): Key | null;
    getLastKey(): Key | null;
    getItem(key: Key): Node<T> | null;
    at(idx: number): Node<T> | null;
    getChildren(key: Key): Iterable<Node<T>>;
}
