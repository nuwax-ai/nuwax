import { Expandable, Key, MultipleSelection, Node, SelectionMode, Sortable, SortDescriptor } from '@react-types/shared';
import { GridState } from '../grid/useGridState';
import { ITableCollection } from './TableCollection';
import { MultipleSelectionState } from '../selection/types';
import { MultipleSelectionStateProps } from '../selection/useMultipleSelectionState';
import { ReactElement } from 'react';
import { TableBodyProps } from './TableBody';
import { TableHeaderProps } from './TableHeader';
export interface TableProps<T> extends MultipleSelection, Sortable, Expandable {
    /** The elements that make up the table. Includes the TableHeader, TableBody, Columns, and Rows. */
    children: [ReactElement<TableHeaderProps<T>>, ReactElement<TableBodyProps<T>>];
    /** A list of row keys to disable. */
    disabledKeys?: Iterable<Key>;
    /**
     * Whether pressing the escape key should clear selection in the table or not.
     *
     * Most experiences should not modify this option as it eliminates a keyboard user's ability to
     * easily clear selection. Only use if the escape key is being handled externally or should not
     * trigger selection clearing contextually.
     *
     * @default 'clearSelection'
     */
    escapeKeyBehavior?: 'clearSelection' | 'none';
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
    /** The id of the column that displays hierarchical data. */
    treeColumn?: Key;
}
export interface TableState<T> extends GridState<T, ITableCollection<T>> {
    /** A collection of rows and columns in the table. */
    collection: ITableCollection<T>;
    /** Whether the row selection checkboxes should be displayed. */
    showSelectionCheckboxes: boolean;
    /** The current sorted column and direction. */
    sortDescriptor: SortDescriptor | null;
    /** Calls the provided onSortChange handler with the provided column key and sort direction. */
    sort(columnKey: Key, direction?: 'ascending' | 'descending'): void;
    /**
     * Whether keyboard navigation is disabled, such as when the arrow keys should be handled by a
     * component within a cell.
     */
    isKeyboardNavigationDisabled: boolean;
    /**
     * Set whether keyboard navigation is disabled, such as when the arrow keys should be handled by a
     * component within a cell.
     */
    setKeyboardNavigationDisabled: (val: boolean) => void;
    /** A set of keys for items that are expanded. */
    expandedKeys: Set<Key>;
    /** Toggles the expanded state for a row by its key. */
    toggleKey(key: Key): void;
    /** The id of the column that displays hierarchical data. */
    treeColumn: Key | null;
}
export interface CollectionBuilderContext<T> {
    showSelectionCheckboxes: boolean;
    showDragButtons: boolean;
    selectionMode: SelectionMode;
    columns: Node<T>[];
}
export interface TableStateProps<T> extends MultipleSelectionStateProps, Expandable, Sortable {
    /** The elements that make up the table. Includes the TableHeader, TableBody, Columns, and Rows. */
    children?: [ReactElement<TableHeaderProps<T>>, ReactElement<TableBodyProps<T>>];
    /** A pre-constructed collection to use instead of building one from items and children. */
    collection?: ITableCollection<T>;
    /** Whether the row selection checkboxes should be displayed. */
    showSelectionCheckboxes?: boolean;
    /**
     * Whether the row drag button should be displayed.
     *
     * @private
     */
    showDragButtons?: boolean;
    /** @private - Do not use unless you know what you're doing. */
    UNSAFE_selectionState?: MultipleSelectionState;
    /** The id of the column that displays hierarchical data. */
    treeColumn?: Key;
}
/**
 * Provides state management for a table component. Handles building a collection of columns and
 * rows from props. In addition, it tracks row selection and manages sort order changes.
 */
export declare function useTableState<T extends object>(props: TableStateProps<T>): TableState<T>;
/**
 * Filters a collection using the provided filter function and returns a new TableState.
 */
export declare function UNSTABLE_useFilteredTableState<T extends object>(state: TableState<T>, filterFn: ((nodeValue: string, node: Node<T>) => boolean) | null | undefined): TableState<T>;
