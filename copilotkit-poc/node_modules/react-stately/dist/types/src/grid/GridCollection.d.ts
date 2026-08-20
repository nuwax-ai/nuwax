import { Collection, Key, Node } from '@react-types/shared';
export interface IGridCollection<T> extends Collection<GridNode<T>> {
    /** The number of columns in the grid. */
    columnCount: number;
    /** A list of rows in the grid. */
    rows: GridNode<T>[];
}
export interface GridRow<T> extends Partial<GridNode<T>> {
    key?: Key;
    type: string;
    childNodes: Iterable<Node<T>>;
}
export interface GridNode<T> extends Node<T> {
    column?: GridNode<T>;
    /**
     * The number of columns spanned by this cell. Use `colSpan` instead.
     *
     * @deprecated
     */
    colspan?: number;
    /** The number of columns spanned by this cell. */
    colSpan?: number | null;
    /** The column index of this cell, accounting for any colSpans. */
    colIndex?: number | null;
    /** The index of this node within its parent, ignoring sibling nodes that aren't of the same type. */
    indexOfType?: number;
}
interface GridCollectionOptions<T> {
    columnCount: number;
    items: GridRow<T>[];
    visitNode?: (cell: GridNode<T>) => GridNode<T>;
}
export declare class GridCollection<T> implements IGridCollection<T> {
    keyMap: Map<Key, GridNode<T>>;
    columnCount: number;
    rows: GridNode<T>[];
    constructor(opts: GridCollectionOptions<T>);
    [Symbol.iterator](): IterableIterator<GridNode<T>>;
    get size(): number;
    getKeys(): IterableIterator<Key>;
    getKeyBefore(key: Key): Key | null;
    getKeyAfter(key: Key): Key | null;
    getFirstKey(): Key | null;
    getLastKey(): Key | null;
    getItem(key: Key): GridNode<T> | null;
    at(idx: number): GridNode<T> | null;
    getChildren(key: Key): Iterable<GridNode<T>>;
}
export {};
