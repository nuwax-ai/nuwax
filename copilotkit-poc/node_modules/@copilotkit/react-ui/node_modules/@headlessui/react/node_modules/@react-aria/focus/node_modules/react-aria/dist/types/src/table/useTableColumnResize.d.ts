import { ColumnSize } from 'react-stately/useTableState';
import { DOMAttributes, FocusableElement, Key, RefObject } from '@react-types/shared';
import { GridNode } from 'react-stately/private/grid/GridCollection';
import { TableColumnResizeState } from 'react-stately/useTableState';
export interface TableColumnResizeAria {
    /** Props for the visually hidden input element. */
    inputProps: DOMAttributes;
    /** Props for the resizer element. */
    resizerProps: DOMAttributes;
    /** Whether this column is currently being resized. */
    isResizing: boolean;
}
export interface AriaTableColumnResizeProps<T> {
    /**
     * An object representing the [column header](https://www.w3.org/TR/wai-aria-1.1/#columnheader).
     * Contains all the relevant information that makes up the column header.
     */
    column: GridNode<T>;
    /** Aria label for the hidden input. Gets read when resizing. */
    'aria-label': string;
    /**
     * Ref to the trigger if resizing was started from a column header menu. If it's provided, focus
     * will be returned there when resizing is done. If it isn't provided, it is assumed that the
     * resizer is visible at all time and keyboard resizing is started via pressing Enter on the
     * resizer and not on focus.
     */
    triggerRef?: RefObject<FocusableElement | null>;
    /** If resizing is disabled. */
    isDisabled?: boolean;
    /** Called when resizing starts. */
    onResizeStart?: (widths: Map<Key, ColumnSize>) => void;
    /** Called for every resize event that results in new column sizes. */
    onResize?: (widths: Map<Key, ColumnSize>) => void;
    /** Called when resizing ends. */
    onResizeEnd?: (widths: Map<Key, ColumnSize>) => void;
}
/**
 * Provides the behavior and accessibility implementation for a table column resizer element.
 *
 * @param props - Props for the resizer.
 * @param state - State for the table's resizable columns, as returned by
 *   `useTableColumnResizeState`.
 * @param ref - The ref attached to the resizer's visually hidden input element.
 */
export declare function useTableColumnResize<T>(props: AriaTableColumnResizeProps<T>, state: TableColumnResizeState<T>, ref: RefObject<HTMLInputElement | null>): TableColumnResizeAria;
