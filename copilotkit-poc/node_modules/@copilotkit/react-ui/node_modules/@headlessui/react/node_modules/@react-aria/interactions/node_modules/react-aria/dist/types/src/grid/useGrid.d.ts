import { AriaLabelingProps, DOMAttributes, DOMProps, Key, KeyboardDelegate, RefObject } from '@react-types/shared';
import { IGridCollection as GridCollection } from 'react-stately/private/grid/GridCollection';
import { GridState } from 'react-stately/private/grid/useGridState';
export interface GridProps extends DOMProps, AriaLabelingProps {
    /** Whether the grid uses virtual scrolling. */
    isVirtualized?: boolean;
    /**
     * Whether typeahead navigation is disabled.
     *
     * @default false
     */
    disallowTypeAhead?: boolean;
    /**
     * An optional keyboard delegate implementation for type to select,
     * to override the default.
     */
    keyboardDelegate?: KeyboardDelegate;
    /**
     * Whether initial grid focus should be placed on the grid row or grid cell.
     *
     * @default 'row'
     */
    focusMode?: 'row' | 'cell';
    /**
     * A function that returns the text that should be announced by assistive technology when a row is
     * added or removed from selection.
     *
     * @default (key) => state.collection.getItem(key)?.textValue
     */
    getRowText?: (key: Key) => string;
    /**
     * The ref attached to the scrollable body. Used to provided automatic scrolling on item focus for
     * non-virtualized grids.
     */
    scrollRef?: RefObject<HTMLElement | null>;
    /** Handler that is called when a user performs an action on the row. */
    onRowAction?: (key: Key) => void;
    /** Handler that is called when a user performs an action on the cell. */
    onCellAction?: (key: Key) => void;
    /**
     * Whether pressing the escape key should clear selection in the grid or not.
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
}
export interface GridAria {
    /** Props for the grid element. */
    gridProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a grid component. A grid displays data
 * in one or more rows and columns and enables a user to navigate its contents via directional
 * navigation keys.
 *
 * @param props - Props for the grid.
 * @param state - State for the grid, as returned by `useGridState`.
 * @param ref - The ref attached to the grid element.
 */
export declare function useGrid<T>(props: GridProps, state: GridState<T, GridCollection<T>>, ref: RefObject<HTMLElement | null>): GridAria;
