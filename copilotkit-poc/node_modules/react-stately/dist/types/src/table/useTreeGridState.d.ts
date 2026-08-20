import { GridNode } from '../grid/GridCollection';
import { Key } from '@react-types/shared';
import { TableState, TableStateProps } from './useTableState';
export interface TreeGridState<T> extends Omit<TableState<T>, 'expandedKeys'> {
    /** A set of keys for items that are expanded. */
    expandedKeys: 'all' | Set<Key>;
    /** Toggles the expanded state for a row by its key. */
    toggleKey(key: Key): void;
    /** The key map containing nodes representing the collection's tree grid structure. */
    keyMap: Map<Key, GridNode<T>>;
    /** The number of leaf columns provided by the user. */
    userColumnCount: number;
}
export interface TreeGridStateProps<T> extends Omit<TableStateProps<T>, 'collection'> {
    /** The currently expanded keys in the collection (controlled). */
    UNSTABLE_expandedKeys?: 'all' | Iterable<Key>;
    /** The initial expanded keys in the collection (uncontrolled). */
    UNSTABLE_defaultExpandedKeys?: 'all' | Iterable<Key>;
    /** Handler that is called when items are expanded or collapsed. */
    UNSTABLE_onExpandedChange?: (keys: Set<Key>) => any;
}
/**
 * Provides state management for a tree grid component. Handles building a collection of columns and
 * rows from props. In addition, it tracks and manages expanded rows, row selection, and sort order
 * changes.
 */
export declare function UNSTABLE_useTreeGridState<T extends object>(props: TreeGridStateProps<T>): TreeGridState<T>;
