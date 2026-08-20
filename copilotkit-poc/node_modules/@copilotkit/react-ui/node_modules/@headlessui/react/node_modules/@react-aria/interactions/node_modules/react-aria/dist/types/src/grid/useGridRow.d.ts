import { DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
import { IGridCollection as GridCollection, GridNode } from 'react-stately/private/grid/GridCollection';
import { GridState } from 'react-stately/private/grid/useGridState';
import { SelectableItemStates } from '../selection/useSelectableItem';
export interface GridRowProps<T> {
    /**
     * An object representing the grid row. Contains all the relevant information that makes up the
     * grid row.
     */
    node: GridNode<T>;
    /** Whether the grid row is contained in a virtual scroller. */
    isVirtualized?: boolean;
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
    /**
     * Handler that is called when a user performs an action on the row.
     * Please use onCellAction at the collection level instead.
     *
     * @deprecated
     */
    onAction?: () => void;
}
export interface GridRowAria extends SelectableItemStates {
    /** Props for the grid row element. */
    rowProps: DOMAttributes;
    /** Whether the row is currently in a pressed state. */
    isPressed: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a row in a grid.
 *
 * @param props - Props for the row.
 * @param state - State of the parent grid, as returned by `useGridState`.
 */
export declare function useGridRow<T, C extends GridCollection<T>, S extends GridState<T, C>>(props: GridRowProps<T>, state: S, ref: RefObject<FocusableElement | null>): GridRowAria;
