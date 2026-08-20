import { AriaToggleProps } from '../toggle/useToggle';
import { DOMAttributesWithRef, InputDOMProps, RefObject, ValidationResult } from '@react-types/shared';
import { InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { ToggleProps, ToggleState } from 'react-stately/useToggleState';
export interface CheckboxProps extends ToggleProps {
    /**
     * Indeterminism is presentational only.
     * The indeterminate visual representation remains regardless of user interaction.
     */
    isIndeterminate?: boolean;
}
export interface AriaCheckboxProps extends CheckboxProps, InputDOMProps, AriaToggleProps {
}
export interface CheckboxAria extends ValidationResult {
    /** Props for the label wrapper element. */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the checkbox description element, if any. */
    descriptionProps: DOMAttributesWithRef<HTMLElement>;
    /** Props for the checkbox error message element, if any. */
    errorMessageProps: DOMAttributesWithRef<HTMLElement>;
    /** Whether the checkbox is selected. */
    isSelected: boolean;
    /** Whether the checkbox is in a pressed state. */
    isPressed: boolean;
    /** Whether the checkbox is disabled. */
    isDisabled: boolean;
    /** Whether the checkbox is read only. */
    isReadOnly: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a checkbox component.
 * Checkboxes allow users to select multiple items from a list of individual items, or
 * to mark one individual item as selected.
 *
 * @param props - Props for the checkbox.
 * @param state - State for the checkbox, as returned by `useToggleState`.
 * @param inputRef - A ref for the HTML input element.
 */
export declare function useCheckbox(props: AriaCheckboxProps, state: ToggleState, inputRef: RefObject<HTMLInputElement | null>): CheckboxAria;
