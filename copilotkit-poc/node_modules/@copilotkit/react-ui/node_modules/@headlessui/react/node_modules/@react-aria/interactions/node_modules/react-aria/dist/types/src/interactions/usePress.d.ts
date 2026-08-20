import { DOMAttributes, PressEvents, RefObject } from '@react-types/shared';
export interface PressProps extends PressEvents {
    /** Whether the target is in a controlled press state (e.g. an overlay it triggers is open). */
    isPressed?: boolean;
    /** Whether the press events should be disabled. */
    isDisabled?: boolean;
    /** Whether the target should not receive focus on press. */
    preventFocusOnPress?: boolean;
    /**
     * Whether press events should be canceled when the pointer leaves the target while pressed.
     * By default, this is `false`, which means if the pointer returns back over the target while
     * still pressed, onPressStart will be fired again. If set to `true`, the press is canceled
     * when the pointer leaves the target and onPressStart will not be fired if the pointer returns.
     */
    shouldCancelOnPointerExit?: boolean;
    /** Whether text selection should be enabled on the pressable element. */
    allowTextSelectionOnPress?: boolean;
}
export interface PressHookProps extends PressProps {
    /** A ref to the target element. */
    ref?: RefObject<Element | null>;
}
export interface PressResult {
    /** Whether the target is currently pressed. */
    isPressed: boolean;
    /** Props to spread on the target element. */
    pressProps: DOMAttributes;
}
/**
 * Handles press interactions across mouse, touch, keyboard, and screen readers.
 * It normalizes behavior across browsers and platforms, and handles many nuances
 * of dealing with pointer and keyboard events.
 */
export declare function usePress(props: PressHookProps): PressResult;
