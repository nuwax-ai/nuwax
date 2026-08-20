import { Key } from '@react-types/shared';
export interface TreeOptions<T extends object> {
    /** Initial root items in the tree. */
    initialItems?: T[];
    /** The keys for the initially selected items. */
    initialSelectedKeys?: Iterable<Key>;
    /** A function that returns a unique key for an item object. */
    getKey?: (item: T) => Key;
    /** A function that returns the children for an item object. */
    getChildren?: (item: T) => T[];
}
interface TreeNode<T extends object> {
    /** A unique key for the tree node. */
    key: Key;
    /** The key of the parent node. */
    parentKey?: Key | null;
    /** The value object for the tree node. */
    value: T;
    /** Children of the tree node. */
    children: TreeNode<T>[] | null;
}
export interface TreeData<T extends object> {
    /** The root nodes in the tree. */
    items: TreeNode<T>[];
    /** The keys of the currently selected items in the tree. */
    selectedKeys: Set<Key>;
    /** Sets the selected keys. */
    setSelectedKeys(keys: Set<Key>): void;
    /**
     * Gets a node from the tree by key.
     *
     * @param key - The key of the item to retrieve.
     */
    getItem(key: Key): TreeNode<T> | undefined;
    /**
     * Inserts an item into a parent node as a child.
     *
     * @param parentKey - The key of the parent item to insert into. `null` for the root.
     * @param index - The index within the parent to insert into.
     * @param value - The value to insert.
     */
    insert(parentKey: Key | null, index: number, ...values: T[]): void;
    /**
     * Inserts items into the list before the item at the given key.
     *
     * @param key - The key of the item to insert before.
     * @param values - The values to insert.
     */
    insertBefore(key: Key, ...values: T[]): void;
    /**
     * Inserts items into the list after the item at the given key.
     *
     * @param key - The key of the item to insert after.
     * @param values - The values to insert.
     */
    insertAfter(key: Key, ...values: T[]): void;
    /**
     * Appends an item into a parent node as a child.
     *
     * @param parentKey - The key of the parent item to insert into. `null` for the root.
     * @param value - The value to insert.
     */
    append(parentKey: Key | null, ...values: T[]): void;
    /**
     * Prepends an item into a parent node as a child.
     *
     * @param parentKey - The key of the parent item to insert into. `null` for the root.
     * @param value - The value to insert.
     */
    prepend(parentKey: Key | null, ...value: T[]): void;
    /**
     * Removes an item from the tree by its key.
     *
     * @param key - The key of the item to remove.
     */
    remove(...keys: Key[]): void;
    /**
     * Removes all items from the tree that are currently
     * in the set of selected items.
     */
    removeSelectedItems(): void;
    /**
     * Moves an item within the tree.
     *
     * @param key - The key of the item to move.
     * @param toParentKey - The key of the new parent to insert into. `null` for the root.
     * @param index - The index within the new parent to insert at.
     */
    move(key: Key, toParentKey: Key | null, index: number): void;
    /**
     * Moves one or more items before a given key.
     *
     * @param key - The key of the item to move the items before.
     * @param keys - The keys of the items to move.
     */
    moveBefore(key: Key, keys: Iterable<Key>): void;
    /**
     * Moves one or more items after a given key.
     *
     * @param key - The key of the item to move the items after.
     * @param keys - The keys of the items to move.
     */
    moveAfter(key: Key, keys: Iterable<Key>): void;
    /**
     * Updates an item in the tree.
     *
     * @param key - The key of the item to update.
     * @param newValue - The new value for the item.
     */
    update(key: Key, newValue: T): void;
}
/**
 * Manages state for an immutable tree data structure, and provides convenience methods to
 * update the data over time.
 */
export declare function useTreeData<T extends object>(options: TreeOptions<T>): TreeData<T>;
export {};
