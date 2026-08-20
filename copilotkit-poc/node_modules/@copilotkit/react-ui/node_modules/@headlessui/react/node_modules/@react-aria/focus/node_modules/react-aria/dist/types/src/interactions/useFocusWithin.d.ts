import { DOMAttributes } from '@react-types/shared';
import { FocusEvent } from 'react';
export interface FocusWithinProps {
    /** Whether the focus within events should be disabled. */
    isDisabled?: boolean;
    /** Handler that is called when the target element or a descendant receives focus. */
    onFocusWithin?: (e: FocusEvent) => void;
    /** Handler that is called when the target element and all descendants lose focus. */
    onBlurWithin?: (e: FocusEvent) => void;
    /** Handler that is called when the the focus within state changes. */
    onFocusWithinChange?: (isFocusWithin: boolean) => void;
}
export interface FocusWithinResult {
    /** Props to spread onto the target element. */
    focusWithinProps: DOMAttributes;
}
/**
 * Handles focus events for the target and its descendants.
 */
export declare function useFocusWithin(props: FocusWithinProps): FocusWithinResult;
