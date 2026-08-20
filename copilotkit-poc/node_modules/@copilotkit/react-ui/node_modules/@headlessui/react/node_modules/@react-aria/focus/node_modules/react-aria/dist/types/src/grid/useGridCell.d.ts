import { DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
import { IGridCollection as GridCollection, GridNode } from 'react-stately/private/grid/GridCollection';
import { GridState } from 'react-stately/private/grid/useGridState';
export interface GridCellProps {
    /**
     * An object representing the grid cell. Contains all the relevant information that makes up the
     * grid cell.
     */
    node: GridNode<unknown>;
    /** Whether the grid cell is contained in a virtual scroller. */
    isVirtualized?: boolean;
    /**
     * Whether the cell or its first focusable child element should be focused when the grid cell is
     * focused.
     */
    focusMode?: 'child' | 'cell';
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
    /** Indicates how many columns the data cell spans. */
    colSpan?: number;
    /**
     * Handler that is called when a user performs an action on the cell.
     * Please use onCellAction at the collection level instead.
     *
     * @deprecated
     */
    onAction?: () => void;
}
export interface GridCellAria {
    /** Props for the grid cell element. */
    gridCellProps: DOMAttributes;
    /** Whether the cell is currently in a pressed state. */
    isPressed: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a cell in a grid.
 *
 * @param props - Props for the cell.
 * @param state - State of the parent grid, as returned by `useGridState`.
 */
export declare function useGridCell<T, C extends GridCollection<T>>(props: GridCellProps, state: GridState<T, C>, ref: RefObject<FocusableElement | null>): GridCellAria;
