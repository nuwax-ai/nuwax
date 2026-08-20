import { AriaButtonProps } from '../button/useButton';
import { AriaLabelingProps, DOMAttributes, DOMProps, GroupDOMAttributes, TextInputDOMEvents, ValidationResult } from '@react-types/shared';
import { InputHTMLAttributes, LabelHTMLAttributes, RefObject } from 'react';
import { NumberFieldProps, NumberFieldState } from 'react-stately/useNumberFieldState';
export interface AriaNumberFieldProps extends NumberFieldProps, DOMProps, AriaLabelingProps, TextInputDOMEvents {
    /**
     * A custom aria-label for the decrement button. If not provided, the localized string "Decrement"
     * is used.
     */
    decrementAriaLabel?: string;
    /**
     * A custom aria-label for the increment button. If not provided, the localized string "Increment"
     * is used.
     */
    incrementAriaLabel?: string;
    /**
     * Enables or disables changing the value with scroll.
     */
    isWheelDisabled?: boolean;
}
export interface NumberFieldAria extends ValidationResult {
    /** Props for the label element. */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the group wrapper around the input and stepper buttons. */
    groupProps: GroupDOMAttributes;
    /** Props for the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the increment button, to be passed to `useButton`. */
    incrementButtonProps: AriaButtonProps;
    /** Props for the decrement button, to be passed to `useButton`. */
    decrementButtonProps: AriaButtonProps;
    /** Props for the number field's description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the number field's error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a number field component. Number
 * fields allow users to enter a number, and increment or decrement the value using stepper
 * buttons.
 */
export declare function useNumberField(props: AriaNumberFieldProps, state: NumberFieldState, inputRef: RefObject<HTMLInputElement | null>): NumberFieldAria;
