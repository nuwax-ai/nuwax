import { Collection, DraggableCollectionEndEvent, DraggableCollectionProps, DragItem, DragMoveEvent, DragPreviewRenderer, DragStartEvent, DropOperation, Key, Node, RefObject } from '@react-types/shared';
import { MultipleSelectionManager } from '../selection/types';
export interface DraggableCollectionStateOptions<T = object> extends DraggableCollectionProps<T> {
    /** A collection of items. */
    collection: Collection<Node<unknown>>;
    /** An interface for reading and updating multiple selection state. */
    selectionManager: MultipleSelectionManager;
    /** Whether the drag events should be disabled. */
    isDisabled?: boolean;
}
export interface DraggableCollectionState {
    /** A collection of items. */
    collection: Collection<Node<unknown>>;
    /** An interface for reading and updating multiple selection state. */
    selectionManager: MultipleSelectionManager;
    /** The key of the item that initiated a drag. */
    draggedKey: Key | null;
    /** The keys of the items that are currently being dragged. */
    draggingKeys: Set<Key>;
    /** Whether drag events are disabled. */
    isDisabled?: boolean;
    /** Returns whether the given key is currently being dragged. */
    isDragging(key: Key): boolean;
    /** Returns the keys of the items that will be dragged with the given key (e.g. selected items). */
    getKeysForDrag(key: Key): Set<Key>;
    /** Returns the items to drag for the given key. */
    getItems(key: Key): DragItem[];
    /** The ref of the element that will be rendered as the drag preview while dragging. */
    preview?: RefObject<DragPreviewRenderer | null>;
    /**
     * Function that returns the drop operations that are allowed for the dragged items. If not
     * provided, all drop operations are allowed.
     */
    getAllowedDropOperations?: () => DropOperation[];
    /** Begins a drag for the given key. This triggers the onDragStart event. */
    startDrag(key: Key, event: DragStartEvent): void;
    /** Triggers an onDragMove event. */
    moveDrag(event: DragMoveEvent): void;
    /** Ends the current drag, and emits an onDragEnd event. */
    endDrag(event: DraggableCollectionEndEvent): void;
}
/**
 * Manages state for a draggable collection.
 */
export declare function useDraggableCollectionState<T = object>(props: DraggableCollectionStateOptions<T>): DraggableCollectionState;
