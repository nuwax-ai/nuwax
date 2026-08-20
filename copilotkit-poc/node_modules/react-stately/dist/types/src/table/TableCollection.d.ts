import { GridCollection, GridNode, IGridCollection } from '../grid/GridCollection';
import { Key } from '@react-types/shared';
export interface ITableCollection<T> extends IGridCollection<T> {
    /** A list of header row nodes in the table. */
    headerRows: GridNode<T>[];
    /** A list of column nodes in the table. */
    columns: GridNode<T>[];
    /**
     * A set of column keys that serve as the [row
     * header](https://www.w3.org/TR/wai-aria-1.1/#rowheader).
     */
    rowHeaderColumnKeys: Set<Key>;
    /** The node that makes up the header of the table. */
    head?: GridNode<T>;
    /** The node that makes up the body of the table. */
    body: GridNode<T>;
}
interface GridCollectionOptions {
    showSelectionCheckboxes?: boolean;
    showDragButtons?: boolean;
}
/** @private */
export declare function buildHeaderRows<T>(keyMap: Map<Key, GridNode<T>>, columnNodes: GridNode<T>[]): GridNode<T>[];
export declare class TableCollection<T> extends GridCollection<T> implements ITableCollection<T> {
    headerRows: GridNode<T>[];
    columns: GridNode<T>[];
    rowHeaderColumnKeys: Set<Key>;
    body: GridNode<T>;
    _size: number;
    constructor(nodes: Iterable<GridNode<T>>, prev?: ITableCollection<T> | null, opts?: GridCollectionOptions);
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
    getTextValue(key: Key): string;
}
export {};
