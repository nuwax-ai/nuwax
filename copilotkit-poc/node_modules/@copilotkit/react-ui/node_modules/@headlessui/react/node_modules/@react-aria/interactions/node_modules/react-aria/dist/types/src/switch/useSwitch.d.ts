import { AriaToggleProps } from '../toggle/useToggle';
import { DOMAttributesWithRef, InputDOMProps, RefObject, ValidationResult } from '@react-types/shared';
import { InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { ToggleProps, ToggleState } from 'react-stately/useToggleState';
export interface SwitchProps extends ToggleProps {
}
export interface AriaSwitchProps extends SwitchProps, InputDOMProps, AriaToggleProps {
    /**
     * Identifies the element (or elements) whose contents or presence are controlled by the current
     * element.
     */
    'aria-controls'?: string;
}
export interface SwitchAria extends ValidationResult {
    /** Props for the label wrapper element. */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the switch description element, if any. */
    descriptionProps: DOMAttributesWithRef<HTMLElement>;
    /** Props for the switch error message element, if any. */
    errorMessageProps: DOMAttributesWithRef<HTMLElement>;
    /** Whether the switch is selected. */
    isSelected: boolean;
    /** Whether the switch is in a pressed state. */
    isPressed: boolean;
    /** Whether the switch is disabled. */
    isDisabled: boolean;
    /** Whether the switch is read only. */
    isReadOnly: boolean;
}
/**
 * Provides the behavior and accessibility implementation for a switch component.
 * A switch is similar to a checkbox, but represents on/off values as opposed to selection.
 *
 * @param props - Props for the switch.
 * @param state - State for the switch, as returned by `useToggleState`.
 * @param ref - Ref to the HTML input element.
 */
export declare function useSwitch(props: AriaSwitchProps, state: ToggleState, ref: RefObject<HTMLInputElement | null>): SwitchAria;
