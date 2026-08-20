import { DOMAttributes, FocusableElement, RefObject, Node as RSNode } from '@react-types/shared';
import type { ListState } from 'react-stately/useListState';
import { SelectableItemStates } from '../selection/useSelectableItem';
import type { TreeState } from 'react-stately/useTreeState';
export interface AriaGridListItemOptions {
    /**
     * An object representing the list item. Contains all the relevant information that makes up the
     * list row.
     */
    node: RSNode<unknown>;
    /** Whether the list row is contained in a virtual scroller. */
    isVirtualized?: boolean;
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
    /** Whether this item has children, even if not loaded yet. */
    hasChildItems?: boolean;
}
export interface GridListItemAria extends SelectableItemStates {
    /** Props for the list row element. */
    rowProps: DOMAttributes;
    /** Props for the grid cell element within the list row. */
    gridCellProps: DOMAttributes;
    /** Props for the list item description element, if any. */
    descriptionProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a row in a grid list.
 *
 * @param props - Props for the row.
 * @param state - State of the parent list, as returned by `useListState`.
 * @param ref - The ref attached to the row element.
 */
export declare function useGridListItem<T>(props: AriaGridListItemOptions, state: ListState<T> | TreeState<T>, ref: RefObject<FocusableElement | null>): GridListItemAria;
