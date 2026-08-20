import { DOMAttributes, MoveEvents } from '@react-types/shared';
export interface MoveResult {
    /** Props to spread on the target element. */
    moveProps: DOMAttributes;
}
/**
 * Handles move interactions across mouse, touch, and keyboard, including dragging with
 * the mouse or touch, and using the arrow keys. Normalizes behavior across browsers and
 * platforms, and ignores emulated mouse events on touch devices.
 */
export declare function useMove(props: MoveEvents): MoveResult;
