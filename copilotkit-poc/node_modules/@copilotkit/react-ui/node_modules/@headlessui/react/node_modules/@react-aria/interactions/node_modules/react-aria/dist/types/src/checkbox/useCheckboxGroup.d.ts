import { AriaLabelingProps, AriaValidationProps, DOMAttributes, DOMProps, FocusEvents, InputDOMProps, ValidationResult } from '@react-types/shared';
import { CheckboxGroupProps, CheckboxGroupState } from 'react-stately/useCheckboxGroupState';
export interface AriaCheckboxGroupProps extends CheckboxGroupProps, InputDOMProps, DOMProps, AriaLabelingProps, AriaValidationProps, FocusEvents {
}
export interface CheckboxGroupAria extends ValidationResult {
    /** Props for the checkbox group wrapper element. */
    groupProps: DOMAttributes;
    /** Props for the checkbox group's visible label (if any). */
    labelProps: DOMAttributes;
    /** Props for the checkbox group description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the checkbox group error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a checkbox group component.
 * Checkbox groups allow users to select multiple items from a list of options.
 *
 * @param props - Props for the checkbox group.
 * @param state - State for the checkbox group, as returned by `useCheckboxGroupState`.
 */
export declare function useCheckboxGroup(props: AriaCheckboxGroupProps, state: CheckboxGroupState): CheckboxGroupAria;
