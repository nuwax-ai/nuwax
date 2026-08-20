import { AriaButtonProps } from '../button/useButton';
import { DOMAttributes, FocusableElement, Node, RefObject } from '@react-types/shared';
import type { ListState } from 'react-stately/useListState';
import { SelectableItemStates } from '../selection/useSelectableItem';
export interface TagAria extends SelectableItemStates {
    /** Props for the tag row element. */
    rowProps: DOMAttributes;
    /** Props for the tag cell element. */
    gridCellProps: DOMAttributes;
    /** Props for the tag remove button. */
    removeButtonProps: AriaButtonProps;
    /** Whether the tag can be removed. */
    allowsRemoving: boolean;
}
export interface AriaTagProps<T> {
    /** An object representing the tag. Contains all the relevant information that makes up the tag. */
    item: Node<T>;
}
/**
 * Provides the behavior and accessibility implementation for a tag component.
 *
 * @param props - Props to be applied to the tag.
 * @param state - State for the tag group, as returned by `useListState`.
 * @param ref - A ref to a DOM element for the tag.
 */
export declare function useTag<T>(props: AriaTagProps<T>, state: ListState<T>, ref: RefObject<FocusableElement | null>): TagAria;
