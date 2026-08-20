import { AriaLabelingProps, DOMAttributesWithRef, DOMProps, FocusableProps, PressEvents, RefObject } from '@react-types/shared';
import { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';
import { RadioGroupState } from 'react-stately/useRadioGroupState';
export interface RadioProps extends FocusableProps {
    /**
     * The value of the radio button, used when submitting an HTML form.
     * See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#Value).
     */
    value: string;
    /**
     * The label for the Radio. Accepts any renderable node.
     */
    children?: ReactNode;
    /**
     * Whether the radio button is disabled or not.
     * Shows that a selection exists, but is not available in that circumstance.
     */
    isDisabled?: boolean;
}
export interface AriaRadioProps extends RadioProps, DOMProps, AriaLabelingProps, PressEvents {
}
export interface RadioAria {
    /** Props for the label wrapper element. */
    labelProps: LabelHTMLAttributes<HTMLLabelElement>;
    /** Props for the input element. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the checkbox description element, if any. */
    descriptionProps: DOMAttributesWithRef<HTMLElement>;
    /** Whether the radio is disabled. */
    isDisabled: boolean;
    /** Whether the radio is currently selected. */
    isSelected: boolean;
    /** Whether the radio is in a pressed state. */
    isPressed: boolean;
}
/**
 * Provides the behavior and accessibility implementation for an individual
 * radio button in a radio group.
 *
 * @param props - Props for the radio.
 * @param state - State for the radio group, as returned by `useRadioGroupState`.
 * @param ref - Ref to the HTML input element.
 */
export declare function useRadio(props: AriaRadioProps, state: RadioGroupState, ref: RefObject<HTMLInputElement | null>): RadioAria;
