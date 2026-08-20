import { AriaButtonProps } from '../button/useButton';
import { DOMAttributes, DropActivateEvent, DropEnterEvent, DropEvent, DropExitEvent, DropMoveEvent, DropOperation, FocusableElement, DragTypes as IDragTypes, RefObject } from '@react-types/shared';
export interface DropOptions {
    /** A ref for the droppable element. */
    ref: RefObject<FocusableElement | null>;
    /**
     * A function returning the drop operation to be performed when items matching the given types are
     * dropped on the drop target.
     */
    getDropOperation?: (types: IDragTypes, allowedOperations: DropOperation[]) => DropOperation;
    /** A function that returns the drop operation for a specific point within the target. */
    getDropOperationForPoint?: (types: IDragTypes, allowedOperations: DropOperation[], x: number, y: number) => DropOperation;
    /** Handler that is called when a valid drag enters the drop target. */
    onDropEnter?: (e: DropEnterEvent) => void;
    /** Handler that is called when a valid drag is moved within the drop target. */
    onDropMove?: (e: DropMoveEvent) => void;
    /**
     * Handler that is called after a valid drag is held over the drop target for a period of time.
     * This typically opens the item so that the user can drop within it.
     */
    onDropActivate?: (e: DropActivateEvent) => void;
    /** Handler that is called when a valid drag exits the drop target. */
    onDropExit?: (e: DropExitEvent) => void;
    /** Handler that is called when a valid drag is dropped on the drop target. */
    onDrop?: (e: DropEvent) => void;
    /**
     * Whether the item has an explicit focusable drop affordance to initiate accessible drag and drop
     * mode. If true, the dropProps will omit these event handlers, and they will be applied to
     * dropButtonProps instead.
     */
    hasDropButton?: boolean;
    /**
     * Whether the drop target is disabled. If true, the drop target will not accept any drops.
     */
    isDisabled?: boolean;
}
export interface DropResult {
    /** Props for the droppable element. */
    dropProps: DOMAttributes;
    /** Whether the drop target is currently focused or hovered. */
    isDropTarget: boolean;
    /** Props for the explicit drop button affordance, if any. */
    dropButtonProps?: AriaButtonProps;
}
/**
 * Handles drop interactions for an element, with support for traditional mouse and touch
 * based drag and drop, in addition to full parity for keyboard and screen reader users.
 */
export declare function useDrop(options: DropOptions): DropResult;
