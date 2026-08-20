import { AriaButtonProps } from '../button/useButton';
import { AriaDialogProps } from '../dialog/useDialog';
import { AriaLabelingProps, DOMAttributes, DOMProps, GroupDOMAttributes, InputDOMProps, RefObject, ValidationResult } from '@react-types/shared';
import { CalendarProps } from 'react-stately/useCalendarState';
import { DatePickerProps, DatePickerState, DateValue } from 'react-stately/useDatePickerState';
export interface AriaDatePickerProps<T extends DateValue> extends DatePickerProps<T>, AriaLabelingProps, InputDOMProps, DOMProps, InputDOMProps {
    /**
     * Describes the type of autocomplete functionality the input should provide if any. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautocomplete).
     */
    autoComplete?: string;
}
export interface DatePickerAria extends ValidationResult {
    /** Props for the date picker's visible label element, if any. */
    labelProps: DOMAttributes;
    /** Props for the grouping element containing the date field and button. */
    groupProps: GroupDOMAttributes;
    /** Props for the date field. */
    fieldProps: AriaDatePickerProps<DateValue>;
    /** Props for the popover trigger button. */
    buttonProps: AriaButtonProps;
    /** Props for the description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the error message element, if any. */
    errorMessageProps: DOMAttributes;
    /** Props for the popover dialog. */
    dialogProps: AriaDialogProps;
    /** Props for the calendar within the popover dialog. */
    calendarProps: CalendarProps<DateValue>;
}
/**
 * Provides the behavior and accessibility implementation for a date picker component. A date picker
 * combines a DateField and a Calendar popover to allow users to enter or select a date and time
 * value.
 */
export declare function useDatePicker<T extends DateValue>(props: AriaDatePickerProps<T>, state: DatePickerState, ref: RefObject<Element | null>): DatePickerAria;
