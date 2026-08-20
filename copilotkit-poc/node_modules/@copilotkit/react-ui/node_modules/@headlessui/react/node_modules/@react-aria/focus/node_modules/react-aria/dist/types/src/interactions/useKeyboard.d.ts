import { DOMAttributes, KeyboardEvents } from '@react-types/shared';
export interface KeyboardProps extends KeyboardEvents {
    /** Whether the keyboard events should be disabled. */
    isDisabled?: boolean;
}
export interface KeyboardResult {
    /** Props to spread onto the target element. */
    keyboardProps: DOMAttributes;
}
/**
 * Handles keyboard interactions for a focusable element.
 */
export declare function useKeyboard(props: KeyboardProps): KeyboardResult;
