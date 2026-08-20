import { DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
import { GridNode } from 'react-stately/private/grid/GridCollection';
import { TableState } from 'react-stately/useTableState';
export interface AriaTableCellProps {
    /**
     * An object representing the table cell. Contains all the relevant information that makes up the
     * row header.
     */
    node: GridNode<unknown>;
    /** Whether the cell is contained in a virtual scroller. */
    isVirtualized?: boolean;
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
    /**
     * Handler that is called when a user performs an action on the cell.
     * Please use onCellAction at the collection level instead.
     *
     * @deprecated
     */
    onAction?: () => void;
}
export interface TableCellAria {
    /** Props for the table cell element. */
    gridCellProps: DOMAttributes;
    /** Whether the cell is currently in a pressed state. */
    isPressed: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a cell in a table.
 *
 * @param props - Props for the cell.
 * @param state - State of the table, as returned by `useTableState`.
 * @param ref - The ref attached to the cell element.
 */
export declare function useTableCell<T>(props: AriaTableCellProps, state: TableState<T>, ref: RefObject<FocusableElement | null>): TableCellAria;
