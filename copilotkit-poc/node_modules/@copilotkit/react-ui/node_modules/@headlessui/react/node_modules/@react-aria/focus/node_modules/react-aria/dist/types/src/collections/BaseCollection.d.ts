import { Collection as ICollection, Key, Node } from '@react-types/shared';
import { ReactElement, ReactNode } from 'react';
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
type FilterFn<T> = (textValue: string, node: Node<T>) => boolean;
/** An immutable object representing a Node in a Collection. */
export declare class CollectionNode<T> implements Node<T> {
    static readonly type: string;
    readonly type: string;
    readonly key: Key;
    readonly value: T | null;
    readonly level: number;
    readonly hasChildNodes: boolean;
    readonly rendered: ReactNode;
    readonly textValue: string;
    readonly 'aria-label'?: string;
    readonly index: number;
    readonly parentKey: Key | null;
    readonly prevKey: Key | null;
    readonly nextKey: Key | null;
    readonly firstChildKey: Key | null;
    readonly lastChildKey: Key | null;
    readonly props: any;
    readonly render?: (node: Node<any>) => ReactElement;
    readonly colSpan: number | null;
    readonly colIndex: number | null;
    constructor(key: Key);
    get childNodes(): Iterable<Node<T>>;
    clone(): this;
    filter(collection: BaseCollection<T>, newCollection: BaseCollection<T>, filterFn: FilterFn<T>): CollectionNode<T> | null;
}
export declare class FilterableNode<T> extends CollectionNode<T> {
    filter(collection: BaseCollection<T>, newCollection: BaseCollection<T>, filterFn: FilterFn<T>): CollectionNode<T> | null;
}
export declare class HeaderNode extends CollectionNode<unknown> {
    static readonly type = "header";
}
export declare class LoaderNode extends CollectionNode<unknown> {
    static readonly type = "loader";
}
export declare class ItemNode<T> extends FilterableNode<T> {
    static readonly type = "item";
    filter(collection: BaseCollection<T>, newCollection: BaseCollection<T>, filterFn: FilterFn<T>): ItemNode<T> | null;
}
export declare class SectionNode<T> extends FilterableNode<T> {
    static readonly type = "section";
    filter(collection: BaseCollection<T>, newCollection: BaseCollection<T>, filterFn: FilterFn<T>): SectionNode<T> | null;
}
/**
 * An immutable Collection implementation. Updates are only allowed
 * when it is not marked as frozen. This can be subclassed to implement
 * custom collection behaviors.
 */
export declare class BaseCollection<T> implements ICollection<Node<T>> {
    protected keyMap: Map<Key, CollectionNode<T>>;
    protected firstKey: Key | null;
    protected lastKey: Key | null;
    protected frozen: boolean;
    protected itemCount: number;
    get size(): number;
    getKeys(): IterableIterator<Key>;
    [Symbol.iterator](): IterableIterator<Node<T>>;
    getChildren(key: Key): Iterable<Node<T>>;
    getKeyBefore(key: Key): Key | null;
    getKeyAfter(key: Key): Key | null;
    getFirstKey(): Key | null;
    getLastKey(): Key | null;
    getItem(key: Key): Node<T> | null;
    at(): Node<T>;
    clone(): this;
    addNode(node: CollectionNode<T>): void;
    addDescendants(node: CollectionNode<T>, oldCollection: BaseCollection<T>): void;
    removeNode(key: Key): void;
    commit(firstKey: Key | null, lastKey: Key | null, isSSR?: boolean): void;
    filter(filterFn: FilterFn<T>): this;
}
export {};
