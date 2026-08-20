import { AriaButtonProps } from '../button/useButton';
import { AriaDatePickerProps } from './useDatePicker';
import { AriaDialogProps } from '../dialog/useDialog';
import { AriaLabelingProps, DOMAttributes, DOMProps, GroupDOMAttributes, InputDOMProps, RefObject, ValidationResult } from '@react-types/shared';
import { DateRangePickerProps, DateRangePickerState, DateValue } from 'react-stately/useDateRangePickerState';
import { RangeCalendarProps } from 'react-stately/useRangeCalendarState';
export interface AriaDateRangePickerProps<T extends DateValue> extends DateRangePickerProps<T>, AriaLabelingProps, Omit<InputDOMProps, 'name'>, DOMProps {
}
export interface DateRangePickerAria extends ValidationResult {
    /** Props for the date range picker's visible label element, if any. */
    labelProps: DOMAttributes;
    /** Props for the grouping element containing the date fields and button. */
    groupProps: GroupDOMAttributes;
    /** Props for the start date field. */
    startFieldProps: AriaDatePickerProps<DateValue>;
    /** Props for the end date field. */
    endFieldProps: AriaDatePickerProps<DateValue>;
    /** Props for the popover trigger button. */
    buttonProps: AriaButtonProps;
    /** Props for the description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the error message element, if any. */
    errorMessageProps: DOMAttributes;
    /** Props for the popover dialog. */
    dialogProps: AriaDialogProps;
    /** Props for the range calendar within the popover dialog. */
    calendarProps: RangeCalendarProps<DateValue>;
}
/**
 * Provides the behavior and accessibility implementation for a date picker component.
 * A date range picker combines two DateFields and a RangeCalendar popover to allow
 * users to enter or select a date and time range.
 */
export declare function useDateRangePicker<T extends DateValue>(props: AriaDateRangePickerProps<T>, state: DateRangePickerState, ref: RefObject<Element | null>): DateRangePickerAria;
