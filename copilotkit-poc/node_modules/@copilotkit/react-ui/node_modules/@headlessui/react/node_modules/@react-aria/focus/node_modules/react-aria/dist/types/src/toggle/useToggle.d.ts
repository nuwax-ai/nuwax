import { AriaLabelingProps, AriaValidationProps, DOMAttributesWithRef, FocusableDOMProps, InputDOMProps, PressEvents, RefObject, ValidationResult } from '@react-types/shared';
import { InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { ToggleProps, ToggleState } from 'react-stately/useToggleState';
export interface AriaToggleProps extends ToggleProps, FocusableDOMProps, AriaLabelingProps, AriaValidationProps, InputDOMProps, PressEvents {
    /**
     * Identifies the element (or elements) whose contents or presence are controlled by the current
     * element.
     */
    'aria-controls'?: string;
}
export interface ToggleAria extends ValidationResult {
    /** Props to be spread on the label element. */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props to be spread on the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the checkbox description element, if any. */
    descriptionProps: DOMAttributesWithRef<HTMLElement>;
    /** Props for the checkbox error message element, if any. */
    errorMessageProps: DOMAttributesWithRef<HTMLElement>;
    /** Whether the toggle is selected. */
    isSelected: boolean;
    /** Whether the toggle is in a pressed state. */
    isPressed: boolean;
    /** Whether the toggle is disabled. */
    isDisabled: boolean;
    /** Whether the toggle is read only. */
    isReadOnly: boolean;
    /** Whether the toggle is invalid. */
    isInvalid: boolean;
}
/**
 * Handles interactions for toggle elements, e.g. Checkboxes and Switches.
 */
export declare function useToggle(props: AriaToggleProps, state: ToggleState, ref: RefObject<HTMLInputElement | null>): ToggleAria;
