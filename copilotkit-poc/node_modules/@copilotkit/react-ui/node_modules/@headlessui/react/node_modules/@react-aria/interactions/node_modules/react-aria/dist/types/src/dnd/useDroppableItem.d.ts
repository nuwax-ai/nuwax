import { DroppableCollectionState } from 'react-stately/useDroppableCollectionState';
import { DropTarget, FocusableElement, RefObject } from '@react-types/shared';
import { HTMLAttributes } from 'react';
export interface DroppableItemOptions {
    /** The drop target represented by the item. */
    target: DropTarget;
    /** The ref to the activate button. */
    activateButtonRef?: RefObject<FocusableElement | null>;
}
export interface DroppableItemResult {
    /** Props for the droppable element. */
    dropProps: HTMLAttributes<HTMLElement>;
    /** Whether the item is currently the active drop target. */
    isDropTarget: boolean;
}
/**
 * Handles drop interactions for an item within a collection component.
 */
export declare function useDroppableItem(options: DroppableItemOptions, state: DroppableCollectionState, ref: RefObject<HTMLElement | null>): DroppableItemResult;
