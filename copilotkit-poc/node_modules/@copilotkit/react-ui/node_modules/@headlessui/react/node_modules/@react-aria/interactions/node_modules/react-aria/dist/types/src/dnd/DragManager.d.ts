import { DragEndEvent, DragItem, DropActivateEvent, DropEnterEvent, DropEvent, DropExitEvent, DropOperation, DropTarget as DroppableCollectionTarget, FocusableElement } from '@react-types/shared';
import type { LocalizedStringFormatter } from '@internationalized/string';
import { RefObject } from 'react';
interface DropTarget {
    element: FocusableElement;
    preventFocusOnDrop?: boolean;
    getDropOperation?: (types: Set<string>, allowedOperations: DropOperation[]) => DropOperation;
    onDropEnter?: (e: DropEnterEvent, dragTarget: DragTarget) => void;
    onDropExit?: (e: DropExitEvent) => void;
    onDropTargetEnter?: (target: DroppableCollectionTarget | null) => void;
    onDropActivate?: (e: DropActivateEvent, target: DroppableCollectionTarget | null) => void;
    onDrop?: (e: DropEvent, target: DroppableCollectionTarget | null) => void;
    onKeyDown?: (e: KeyboardEvent, dragTarget: DragTarget) => void;
    activateButtonRef?: RefObject<FocusableElement | null>;
}
export declare function registerDropTarget(target: DropTarget): () => void;
interface DroppableItem {
    element: FocusableElement;
    target: DroppableCollectionTarget;
    getDropOperation?: (types: Set<string>, allowedOperations: DropOperation[]) => DropOperation;
    activateButtonRef?: RefObject<FocusableElement | null>;
}
export declare function registerDropItem(item: DroppableItem): () => void;
interface DragTarget {
    element: FocusableElement;
    items: DragItem[];
    allowedDropOperations: DropOperation[];
    onDragEnd?: (e: DragEndEvent) => void;
}
export declare function beginDragging(target: DragTarget, stringFormatter: LocalizedStringFormatter): void;
export declare function useDragSession(): DragSession | null;
/** @private */
export declare function isVirtualDragging(): boolean;
export declare function isValidDropTarget(element: Element): boolean;
declare class DragSession {
    dragTarget: DragTarget;
    validDropTargets: DropTarget[];
    currentDropTarget: DropTarget | null;
    currentDropItem: DroppableItem | null;
    dropOperation: DropOperation | null;
    private mutationObserver;
    private restoreAriaHidden;
    private stringFormatter;
    private isVirtualClick;
    private initialFocused;
    constructor(target: DragTarget, stringFormatter: LocalizedStringFormatter);
    setup(): void;
    teardown(): void;
    onKeyDown(e: KeyboardEvent): void;
    onKeyUp(e: KeyboardEvent): void;
    getCurrentActivateButton(): FocusableElement | null;
    onFocus(e: FocusEvent): void;
    onBlur(e: FocusEvent): void;
    onClick(e: MouseEvent): void;
    onPointerDown(e: PointerEvent): void;
    cancelEvent(e: Event): void;
    updateValidDropTargets(): void;
    next(): void;
    previous(): void;
    findNearestDropTarget(): number;
    setCurrentDropTarget(dropTarget: DropTarget | null, item?: DroppableItem): void;
    end(): void;
    cancel(): void;
    drop(item?: DroppableItem): void;
    activate(dropTarget: DropTarget | null, dropItem: DroppableItem | null | undefined): void;
}
export {};
