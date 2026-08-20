import { DateFormatter } from '@internationalized/date';
import { DatePickerProps, DateValue, Granularity, TimeValue } from './types';
import { FieldOptions, FormatterOptions } from './utils';
import { FormValidationState } from '../form/useFormValidationState';
import { OverlayTriggerState } from '../overlays/useOverlayTriggerState';
import { ValidationState } from '@react-types/shared';
export interface DatePickerStateOptions<T extends DateValue> extends DatePickerProps<T> {
    /**
     * Determines whether the date picker popover should close automatically when a date is selected.
     *
     * @default true
     */
    shouldCloseOnSelect?: boolean | (() => boolean);
}
export interface DatePickerState extends OverlayTriggerState, FormValidationState {
    /** The currently selected date. */
    value: DateValue | null;
    /** The default date. */
    defaultValue: DateValue | null;
    /** Sets the selected date. */
    setValue(value: DateValue | null): void;
    /**
     * The date portion of the value. This may be set prior to `value` if the user has
     * selected a date but has not yet selected a time.
     */
    dateValue: DateValue | null;
    /** Sets the date portion of the value. */
    setDateValue(value: DateValue): void;
    /**
     * The time portion of the value. This may be set prior to `value` if the user has
     * selected a time but has not yet selected a date.
     */
    timeValue: TimeValue | null;
    /** Sets the time portion of the value. */
    setTimeValue(value: TimeValue): void;
    /** The granularity for the field, based on the `granularity` prop and current value. */
    granularity: Granularity;
    /**
     * Whether the date picker supports selecting a time, according to the `granularity` prop and
     * current value.
     */
    hasTime: boolean;
    /** Whether the calendar popover is currently open. */
    isOpen: boolean;
    /** Sets whether the calendar popover is open. */
    setOpen(isOpen: boolean): void;
    /**
     * The current validation state of the date picker, based on the `validationState`, `minValue`,
     * and `maxValue` props.
     *
     * @deprecated Use `isInvalid` instead.
     */
    validationState: ValidationState | null;
    /** Whether the date picker is invalid, based on the `isInvalid`, `minValue`, and `maxValue` props. */
    isInvalid: boolean;
    /** Formats the selected value using the given options. */
    formatValue(locale: string, fieldOptions: FieldOptions): string;
    /** Gets a formatter based on state's props. */
    getDateFormatter(locale: string, formatOptions: FormatterOptions): DateFormatter;
}
/**
 * Provides state management for a date picker component. A date picker combines a DateField and a
 * Calendar popover to allow users to enter or select a date and time value.
 */
export declare function useDatePickerState<T extends DateValue = DateValue>(props: DatePickerStateOptions<T>): DatePickerState;
