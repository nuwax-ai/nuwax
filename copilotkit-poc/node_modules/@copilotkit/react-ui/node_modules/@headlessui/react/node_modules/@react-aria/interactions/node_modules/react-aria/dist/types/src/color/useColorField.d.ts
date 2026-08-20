import { AriaLabelingProps, AriaValidationProps, DOMAttributes, FocusableDOMProps, TextInputDOMProps, ValidationResult } from '@react-types/shared';
import { ColorFieldProps, ColorFieldState } from 'react-stately/useColorFieldState';
import { InputHTMLAttributes, LabelHTMLAttributes, RefObject } from 'react';
export interface AriaColorFieldProps extends ColorFieldProps, AriaLabelingProps, FocusableDOMProps, Omit<TextInputDOMProps, 'minLength' | 'maxLength' | 'pattern' | 'type' | 'inputMode' | 'autoComplete' | 'autoCorrect' | 'spellCheck'>, AriaValidationProps {
    /** Enables or disables changing the value with scroll. */
    isWheelDisabled?: boolean;
}
export interface ColorFieldAria extends ValidationResult {
    /** Props for the label element. */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the text field's description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the text field's error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a color field component.
 * Color fields allow users to enter and adjust a hex color value.
 */
export declare function useColorField(props: AriaColorFieldProps, state: ColorFieldState, ref: RefObject<HTMLInputElement | null>): ColorFieldAria;
