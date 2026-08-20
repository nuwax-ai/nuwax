import { DOMAttributes } from '@react-types/shared';
export interface AriaFocusRingProps {
    /**
     * Whether to show the focus ring when something
     * inside the container element has focus (true), or
     * only if the container itself has focus (false).
     *
     * @default 'false'
     */
    within?: boolean;
    /** Whether the element is a text input. */
    isTextInput?: boolean;
    /** Whether the element will be auto focused. */
    autoFocus?: boolean;
}
export interface FocusRingAria {
    /** Whether the element is currently focused. */
    isFocused: boolean;
    /** Whether keyboard focus should be visible. */
    isFocusVisible: boolean;
    /** Props to apply to the container element with the focus ring. */
    focusProps: DOMAttributes;
}
/**
 * Determines whether a focus ring should be shown to indicate keyboard focus.
 * Focus rings are visible only when the user is interacting with a keyboard,
 * not with a mouse, touch, or other input methods.
 */
export declare function useFocusRing(props?: AriaFocusRingProps): FocusRingAria;
