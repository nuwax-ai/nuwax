import { DOMAttributes, HelpTextProps, Validation } from '@react-types/shared';
import { LabelAria, LabelAriaProps } from './useLabel';
export interface AriaFieldProps extends LabelAriaProps, HelpTextProps, Omit<Validation<any>, 'isRequired'> {
}
export interface FieldAria extends LabelAria {
    /** Props for the description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the error message element, if any. */
    errorMessageProps: DOMAttributes;
}
/**
 * Provides the accessibility implementation for input fields. Fields accept user input, gain
 * context from their label, and may display a description or error message.
 *
 * @param props - Props for the Field.
 */
export declare function useField(props: AriaFieldProps): FieldAria;
