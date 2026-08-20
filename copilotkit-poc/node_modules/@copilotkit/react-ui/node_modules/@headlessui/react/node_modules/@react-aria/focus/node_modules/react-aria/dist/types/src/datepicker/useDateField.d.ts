import { AriaLabelingProps, DOMAttributes, DOMProps, GroupDOMAttributes, InputDOMProps, RefObject, ValidationResult } from '@react-types/shared';
import { FocusManager } from '../focus/FocusScope';
import { DateFieldProps, DateFieldState, DateValue } from 'react-stately/useDateFieldState';
import { InputHTMLAttributes } from 'react';
import { TimeFieldState, TimePickerProps, TimeValue } from 'react-stately/useTimeFieldState';
export interface AriaDateFieldProps<T extends DateValue> extends DateFieldProps<T>, AriaLabelingProps, DOMProps, InputDOMProps {
    /**
     * Describes the type of autocomplete functionality the input should provide if any. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautocomplete).
     */
    autoComplete?: string;
}
export interface AriaDateFieldOptions<T extends DateValue> extends Omit<AriaDateFieldProps<T>, 'value' | 'defaultValue' | 'onChange' | 'minValue' | 'maxValue' | 'placeholderValue' | 'validate'> {
    /** A ref for the hidden input element for HTML form submission. */
    inputRef?: RefObject<HTMLInputElement | null>;
}
export interface DateFieldAria extends ValidationResult {
    /** Props for the field's visible label element, if any. */
    labelProps: DOMAttributes;
    /** Props for the field grouping element. */
    fieldProps: GroupDOMAttributes;
    /** Props for the hidden input element for HTML form submission. */
    inputProps: InputHTMLAttributes<HTMLInputElement>;
    /** Props for the description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the error message element, if any. */
    errorMessageProps: DOMAttributes;
}
interface HookData {
    ariaLabel?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
    focusManager: FocusManager;
}
export declare const hookData: WeakMap<DateFieldState, HookData>;
export declare const roleSymbol: string;
export declare const focusManagerSymbol: string;
/**
 * Provides the behavior and accessibility implementation for a date field component.
 * A date field allows users to enter and edit date and time values using a keyboard.
 * Each part of a date value is displayed in an individually editable segment.
 */
export declare function useDateField<T extends DateValue>(props: AriaDateFieldOptions<T>, state: DateFieldState, ref: RefObject<Element | null>): DateFieldAria;
export interface AriaTimeFieldProps<T extends TimeValue> extends TimePickerProps<T>, AriaLabelingProps, DOMProps, InputDOMProps {
}
export interface AriaTimeFieldOptions<T extends TimeValue> extends AriaTimeFieldProps<T> {
    /** A ref for the hidden input element for HTML form submission. */
    inputRef?: RefObject<HTMLInputElement | null>;
}
/**
 * Provides the behavior and accessibility implementation for a time field component.
 * A time field allows users to enter and edit time values using a keyboard.
 * Each part of a time value is displayed in an individually editable segment.
 */
export declare function useTimeField<T extends TimeValue>(props: AriaTimeFieldOptions<T>, state: TimeFieldState, ref: RefObject<Element | null>): DateFieldAria;
export {};
