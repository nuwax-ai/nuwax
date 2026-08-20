import { DroppableCollectionProps, DropTargetDelegate, KeyboardDelegate, RefObject } from '@react-types/shared';
import { DroppableCollectionState } from 'react-stately/useDroppableCollectionState';
import { HTMLAttributes } from 'react';
export interface DroppableCollectionOptions extends DroppableCollectionProps {
    /** A delegate object that implements behavior for keyboard focus movement. */
    keyboardDelegate: KeyboardDelegate;
    /** A delegate object that provides drop targets for pointer coordinates within the collection. */
    dropTargetDelegate: DropTargetDelegate;
    /** A custom keyboard event handler for drop targets. */
    onKeyDown?: (e: KeyboardEvent) => void;
}
export interface DroppableCollectionResult {
    /** Props for the collection element. */
    collectionProps: HTMLAttributes<HTMLElement>;
}
/**
 * Handles drop interactions for a collection component, with support for traditional mouse and
 * touch based drag and drop, in addition to full parity for keyboard and screen reader users.
 */
export declare function useDroppableCollection(props: DroppableCollectionOptions, state: DroppableCollectionState, ref: RefObject<HTMLElement | null>): DroppableCollectionResult;
