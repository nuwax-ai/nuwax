import { DroppableCollectionState } from 'react-stately/useDroppableCollectionState';
import { DropTarget, FocusableElement, RefObject } from '@react-types/shared';
import { HTMLAttributes } from 'react';
export interface DropIndicatorProps {
    /** The drop target that the drop indicator represents. */
    target: DropTarget;
    /** The ref to the activate button. */
    activateButtonRef?: RefObject<FocusableElement | null>;
}
export interface DropIndicatorAria {
    /** Props for the drop indicator element. */
    dropIndicatorProps: HTMLAttributes<HTMLElement>;
    /** Whether the drop indicator is currently the active drop target. */
    isDropTarget: boolean;
    /**
     * Whether the drop indicator is hidden, both visually and from assistive technology.
     * Use this to determine whether to omit the element from the DOM entirely.
     */
    isHidden: boolean;
}
/**
 * Handles drop interactions for a target within a droppable collection.
 */
export declare function useDropIndicator(props: DropIndicatorProps, state: DroppableCollectionState, ref: RefObject<HTMLElement | null>): DropIndicatorAria;
