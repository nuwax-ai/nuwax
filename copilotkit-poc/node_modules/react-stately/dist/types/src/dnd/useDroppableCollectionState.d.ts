import { Collection, DragTypes, DropOperation, DroppableCollectionProps, DropTarget, Key, Node } from '@react-types/shared';
import { MultipleSelectionManager } from '../selection/types';
interface DropOperationEvent {
    target: DropTarget;
    types: DragTypes;
    allowedOperations: DropOperation[];
    isInternal: boolean;
    draggingKeys: Set<Key>;
}
export interface DroppableCollectionStateOptions extends Omit<DroppableCollectionProps, 'onDropMove' | 'onDropActivate'> {
    /** A collection of items. */
    collection: Collection<Node<unknown>>;
    /** An interface for reading and updating multiple selection state. */
    selectionManager: MultipleSelectionManager;
    /** Whether the drop events should be disabled. */
    isDisabled?: boolean;
}
export interface DroppableCollectionState {
    /** A collection of items. */
    collection: Collection<Node<unknown>>;
    /** An interface for reading and updating multiple selection state. */
    selectionManager: MultipleSelectionManager;
    /** The current drop target. */
    target: DropTarget | null;
    /** Whether drop events are disabled. */
    isDisabled?: boolean;
    /** Sets the current drop target. */
    setTarget(target: DropTarget | null): void;
    /** Returns whether the given target is equivalent to the current drop target. */
    isDropTarget(target: DropTarget | null): boolean;
    /** Returns the drop operation for the given parameters. */
    getDropOperation(e: DropOperationEvent): DropOperation;
}
/**
 * Manages state for a droppable collection.
 */
export declare function useDroppableCollectionState(props: DroppableCollectionStateOptions): DroppableCollectionState;
export {};
