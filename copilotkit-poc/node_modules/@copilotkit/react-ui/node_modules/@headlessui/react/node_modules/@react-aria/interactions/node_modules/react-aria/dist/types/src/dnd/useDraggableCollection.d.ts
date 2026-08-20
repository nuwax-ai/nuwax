import { DraggableCollectionState } from 'react-stately/useDraggableCollectionState';
import { RefObject } from '@react-types/shared';
export interface DraggableCollectionOptions {
}
/**
 * Handles drag interactions for a collection component, with support for traditional mouse and
 * touch based drag and drop, in addition to full parity for keyboard and screen reader users.
 */
export declare function useDraggableCollection(props: DraggableCollectionOptions, state: DraggableCollectionState, ref: RefObject<HTMLElement | null>): void;
