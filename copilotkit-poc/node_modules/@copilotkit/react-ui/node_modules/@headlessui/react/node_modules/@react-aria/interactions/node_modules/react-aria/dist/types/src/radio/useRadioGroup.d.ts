import { AriaLabelingProps, AriaValidationProps, DOMAttributes, DOMProps, InputDOMProps, ValidationResult } from '@react-types/shared';
import { RadioGroupProps, RadioGroupState } from 'react-stately/useRadioGroupState';
export interface AriaRadioGroupProps extends RadioGroupProps, InputDOMProps, DOMProps, AriaLabelingProps, AriaValidationProps {
}
export interface RadioGroupAria extends ValidationResult {
    /** Props for the radio group wrapper element. */
    radioGroupProps: DOMAttributes;
    /** Props for the radio group's visible label (if any). */
    labelProps: DOMAttributes;
    /** Props for the radio group description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the radio group error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a radio group component.
 * Radio groups allow users to select a single item from a list of mutually exclusive options.
 *
 * @param props - Props for the radio group.
 * @param state - State for the radio group, as returned by `useRadioGroupState`.
 */
export declare function useRadioGroup(props: AriaRadioGroupProps, state: RadioGroupState): RadioGroupAria;
