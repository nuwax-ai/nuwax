import { DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
import { GridNode } from 'react-stately/private/grid/GridCollection';
import { TableState } from 'react-stately/useTableState';
export interface AriaTableColumnHeaderProps<T> {
    /**
     * An object representing the [column header](https://www.w3.org/TR/wai-aria-1.1/#columnheader).
     * Contains all the relevant information that makes up the column header.
     */
    node: GridNode<T>;
    /**
     * Whether the [column header](https://www.w3.org/TR/wai-aria-1.1/#columnheader) is contained in a
     * virtual scroller.
     */
    isVirtualized?: boolean;
}
export interface TableColumnHeaderAria {
    /** Props for the [column header](https://www.w3.org/TR/wai-aria-1.1/#columnheader) element. */
    columnHeaderProps: DOMAttributes;
    /** Whether the column is currently in a pressed state. */
    isPressed: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a column header in a table.
 *
 * @param props - Props for the column header.
 * @param state - State of the table, as returned by `useTableState`.
 * @param ref - The ref attached to the column header element.
 */
export declare function useTableColumnHeader<T>(props: AriaTableColumnHeaderProps<T>, state: TableState<T>, ref: RefObject<FocusableElement | null>): TableColumnHeaderAria;
