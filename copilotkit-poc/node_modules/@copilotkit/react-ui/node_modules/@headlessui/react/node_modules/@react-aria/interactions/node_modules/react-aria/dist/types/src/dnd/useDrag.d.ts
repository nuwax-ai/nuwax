import { AriaButtonProps } from '../button/useButton';
import { DragEndEvent, DragItem, DragMoveEvent, DragPreviewRenderer, DragStartEvent, DropOperation, RefObject } from '@react-types/shared';
import { HTMLAttributes } from 'react';
export interface DragOptions {
    /** Handler that is called when a drag operation is started. */
    onDragStart?: (e: DragStartEvent) => void;
    /** Handler that is called when the drag is moved. */
    onDragMove?: (e: DragMoveEvent) => void;
    /**
     * Handler that is called when the drag operation is ended, either as a result of a drop or a
     * cancellation.
     */
    onDragEnd?: (e: DragEndEvent) => void;
    /** A function that returns the items being dragged. */
    getItems: () => DragItem[];
    /** The ref of the element that will be rendered as the drag preview while dragging. */
    preview?: RefObject<DragPreviewRenderer | null>;
    /**
     * Function that returns the drop operations that are allowed for the dragged items. If not
     * provided, all drop operations are allowed.
     */
    getAllowedDropOperations?: () => DropOperation[];
    /**
     * Whether the item has an explicit focusable drag affordance to initiate accessible drag and drop
     * mode. If true, the dragProps will omit these event handlers, and they will be applied to
     * dragButtonProps instead.
     */
    hasDragButton?: boolean;
    /**
     * Whether the drag operation is disabled. If true, the element will not be draggable.
     */
    isDisabled?: boolean;
}
export interface DragResult {
    /** Props for the draggable element. */
    dragProps: HTMLAttributes<HTMLElement>;
    /** Props for the explicit drag button affordance, if any. */
    dragButtonProps: AriaButtonProps;
    /** Whether the element is currently being dragged. */
    isDragging: boolean;
}
/**
 * Handles drag interactions for an element, with support for traditional mouse and touch
 * based drag and drop, in addition to full parity for keyboard and screen reader users.
 */
export declare function useDrag(options: DragOptions): DragResult;
