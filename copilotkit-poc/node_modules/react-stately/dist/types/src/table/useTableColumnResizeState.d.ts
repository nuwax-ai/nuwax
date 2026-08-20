import { ColumnSize } from './Column';
import { GridNode } from '../grid/GridCollection';
import { Key } from '@react-types/shared';
import { TableState } from './useTableState';
export interface TableColumnResizeStateProps<T> {
    /**
     * Current width of the table or table viewport that the columns
     * should be calculated against.
     */
    tableWidth: number;
    /** A function that is called to find the default width for a given column. */
    getDefaultWidth?: (node: GridNode<T>) => ColumnSize | null | undefined;
    /** A function that is called to find the default minWidth for a given column. */
    getDefaultMinWidth?: (node: GridNode<T>) => ColumnSize | null | undefined;
}
export interface TableColumnResizeState<T> {
    /**
     * Called to update the state that a resize event has occurred.
     * Returns the new widths for all columns based on the resized column.
     */
    updateResizedColumns: (key: Key, width: number) => Map<Key, ColumnSize>;
    /** Callback for when onColumnResize has started. */
    startResize: (key: Key) => void;
    /** Callback for when onColumnResize has ended. */
    endResize: () => void;
    /** Gets the current width for the specified column. */
    getColumnWidth: (key: Key) => number;
    /** Gets the current minWidth for the specified column. */
    getColumnMinWidth: (key: Key) => number;
    /** Gets the current maxWidth for the specified column. */
    getColumnMaxWidth: (key: Key) => number;
    /** Key of the currently resizing column. */
    resizingColumn: Key | null;
    /** A reference to the table state. */
    tableState: TableState<T>;
    /** A map of the current column widths. */
    columnWidths: Map<Key, number>;
}
/**
 * Provides column width state management for a table component with column resizing support.
 * Handles building a map of column widths calculated from the table's width and any provided column
 * width information from the collection. In addition, it tracks the currently resizing column and
 * provides callbacks for updating the widths upon resize operations.
 *
 * @param props - Props for the table.
 * @param state - State for the table, as returned by `useTableState`.
 */
export declare function useTableColumnResizeState<T>(props: TableColumnResizeStateProps<T>, state: TableState<T>): TableColumnResizeState<T>;
