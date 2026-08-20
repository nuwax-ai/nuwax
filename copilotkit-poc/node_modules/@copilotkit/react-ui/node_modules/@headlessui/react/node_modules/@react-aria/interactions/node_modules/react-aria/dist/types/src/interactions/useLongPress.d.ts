import { DOMAttributes, LongPressEvent } from '@react-types/shared';
export interface LongPressProps {
    /** Whether long press events should be disabled. */
    isDisabled?: boolean;
    /** Handler that is called when a long press interaction starts. */
    onLongPressStart?: (e: LongPressEvent) => void;
    /**
     * Handler that is called when a long press interaction ends, either
     * over the target or when the pointer leaves the target.
     */
    onLongPressEnd?: (e: LongPressEvent) => void;
    /**
     * Handler that is called when the threshold time is met while
     * the press is over the target.
     */
    onLongPress?: (e: LongPressEvent) => void;
    /**
     * The amount of time in milliseconds to wait before triggering a long press.
     *
     * @default 500ms
     */
    threshold?: number;
    /**
     * A description for assistive techology users indicating that a long press
     * action is available, e.g. "Long press to open menu".
     */
    accessibilityDescription?: string;
}
export interface LongPressResult {
    /** Props to spread on the target element. */
    longPressProps: DOMAttributes;
}
/**
 * Handles long press interactions across mouse and touch devices. Supports a customizable time
 * threshold, accessibility description, and normalizes behavior across browsers and devices.
 */
export declare function useLongPress(props: LongPressProps): LongPressResult;
