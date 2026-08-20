import { DateFormatter } from '@internationalized/date';
import { DateRange, DateRangePickerProps, DateValue, Granularity, TimeValue } from './types';
import { FieldOptions, FormatterOptions } from './utils';
import { FormValidationState } from '../form/useFormValidationState';
import { OverlayTriggerState } from '../overlays/useOverlayTriggerState';
import { RangeValue, ValidationState } from '@react-types/shared';
export interface DateRangePickerStateOptions<T extends DateValue = DateValue> extends DateRangePickerProps<T> {
    /**
     * Determines whether the date picker popover should close automatically when a date is selected.
     *
     * @default true
     */
    shouldCloseOnSelect?: boolean | (() => boolean);
}
type TimeRange = RangeValue<TimeValue>;
export interface DateRangePickerState extends OverlayTriggerState, FormValidationState {
    /** The currently selected date range. */
    value: RangeValue<DateValue | null>;
    /** The default selected date range. */
    defaultValue: DateRange | null;
    /** Sets the selected date range. */
    setValue(value: DateRange | null): void;
    /**
     * The date portion of the selected range. This may be set prior to `value` if the user has
     * selected a date range but has not yet selected a time range.
     */
    dateRange: RangeValue<DateValue | null> | null;
    /** Sets the date portion of the selected range. */
    setDateRange(value: DateRange): void;
    /**
     * The time portion of the selected range. This may be set prior to `value` if the user has
     * selected a time range but has not yet selected a date range.
     */
    timeRange: RangeValue<TimeValue | null> | null;
    /** Sets the time portion of the selected range. */
    setTimeRange(value: TimeRange): void;
    /** Sets the date portion of either the start or end of the selected range. */
    setDate(part: 'start' | 'end', value: DateValue | null): void;
    /** Sets the time portion of either the start or end of the selected range. */
    setTime(part: 'start' | 'end', value: TimeValue | null): void;
    /** Sets the date and time of either the start or end of the selected range. */
    setDateTime(part: 'start' | 'end', value: DateValue | null): void;
    /** The granularity for the field, based on the `granularity` prop and current value. */
    granularity: Granularity;
    /**
     * Whether the date range picker supports selecting times, according to the `granularity` prop and
     * current value.
     */
    hasTime: boolean;
    /** Whether the calendar popover is currently open. */
    isOpen: boolean;
    /** Sets whether the calendar popover is open. */
    setOpen(isOpen: boolean): void;
    /**
     * The current validation state of the date range picker, based on the `validationState`,
     * `minValue`, and `maxValue` props.
     *
     * @deprecated Use `isInvalid` instead.
     */
    validationState: ValidationState | null;
    /**
     * Whether the date range picker is invalid, based on the `isInvalid`, `minValue`, and `maxValue`
     * props.
     */
    isInvalid: boolean;
    /** Formats the selected range using the given options. */
    formatValue(locale: string, fieldOptions: FieldOptions): {
        start: string;
        end: string;
    } | null;
    /** Gets a formatter based on state's props. */
    getDateFormatter(locale: string, formatOptions: FormatterOptions): DateFormatter;
}
/**
 * Provides state management for a date range picker component.
 * A date range picker combines two DateFields and a RangeCalendar popover to allow
 * users to enter or select a date and time range.
 */
export declare function useDateRangePickerState<T extends DateValue = DateValue>(props: DateRangePickerStateOptions<T>): DateRangePickerState;
export {};
