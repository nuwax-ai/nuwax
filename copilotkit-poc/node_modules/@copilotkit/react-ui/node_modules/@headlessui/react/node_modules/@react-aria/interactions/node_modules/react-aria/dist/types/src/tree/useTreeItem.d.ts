import { AriaButtonProps } from '../button/useButton';
import { AriaGridListItemOptions, GridListItemAria } from '../gridlist/useGridListItem';
import { DOMAttributes, FocusableElement, Node, RefObject } from '@react-types/shared';
import { TreeState } from 'react-stately/useTreeState';
export interface AriaTreeItemOptions extends Omit<AriaGridListItemOptions, 'isVirtualized'> {
    /**
     * An object representing the treegrid item. Contains all the relevant information that makes up
     * the treegrid row.
     */
    node: Node<unknown>;
}
export interface TreeItemAria extends GridListItemAria {
    /** Props for the tree grid row element. */
    rowProps: DOMAttributes;
    /** Props for the tree grid cell element within the tree grid list row. */
    gridCellProps: DOMAttributes;
    /** Props for the tree grid row description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the tree grid row expand button. */
    expandButtonProps: AriaButtonProps;
}
/**
 * Provides the behavior and accessibility implementation for a row in a tree grid list.
 *
 * @param props - Props for the row.
 * @param state - State of the parent list, as returned by `useTreeState`.
 * @param ref - The ref attached to the row element.
 */
export declare function useTreeItem<T>(props: AriaTreeItemOptions, state: TreeState<T>, ref: RefObject<FocusableElement | null>): TreeItemAria;
