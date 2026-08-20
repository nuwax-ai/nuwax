import { Calendar, CalendarIdentifier, DateFormatter } from '@internationalized/date';
import { FieldOptions, FormatterOptions } from './utils';
import { DatePickerProps, DateValue, Granularity } from './types';
import { FormValidationState } from '../form/useFormValidationState';
import { ValidationState } from '@react-types/shared';
export type DateSegmentType = 'era' | 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'dayPeriod' | 'literal' | 'timeZoneName';
export interface DateSegment {
    /** The type of segment. */
    type: DateSegmentType;
    /** The formatted text for the segment. */
    text: string;
    /** The numeric value for the segment, if applicable. */
    value?: number | null;
    /** The minimum numeric value for the segment, if applicable. */
    minValue?: number;
    /** The maximum numeric value for the segment, if applicable. */
    maxValue?: number;
    /** Whether the value is a placeholder. */
    isPlaceholder: boolean;
    /** A placeholder string for the segment. */
    placeholder: string;
    /** Whether the segment is editable. */
    isEditable: boolean;
}
export interface DateFieldState extends FormValidationState {
    /** The current field value. */
    value: DateValue | null;
    /** The default field value. */
    defaultValue: DateValue | null;
    /** The current value, converted to a native JavaScript `Date` object. */
    dateValue: Date;
    /** The calendar system currently in use. */
    calendar: Calendar;
    /** Sets the field's value. */
    setValue(value: DateValue | null): void;
    /** A list of segments for the current value. */
    segments: DateSegment[];
    /** A date formatter configured for the current locale and format. */
    dateFormatter: DateFormatter;
    /**
     * The current validation state of the date field, based on the `validationState`, `minValue`, and
     * `maxValue` props.
     *
     * @deprecated Use `isInvalid` instead.
     */
    validationState: ValidationState | null;
    /** Whether the date field is invalid, based on the `isInvalid`, `minValue`, and `maxValue` props. */
    isInvalid: boolean;
    /** The granularity for the field, based on the `granularity` prop and current value. */
    granularity: Granularity;
    /** The maximum date or time unit that is displayed in the field. */
    maxGranularity: 'year' | 'month' | Granularity;
    /** Whether the field is disabled. */
    isDisabled: boolean;
    /** Whether the field is read only. */
    isReadOnly: boolean;
    /** Whether the field is required. */
    isRequired: boolean;
    /**
     * Increments the given segment. Upon reaching the minimum or maximum value, the value wraps
     * around to the opposite limit.
     */
    increment(type: DateSegmentType): void;
    /**
     * Decrements the given segment. Upon reaching the minimum or maximum value, the value wraps
     * around to the opposite limit.
     */
    decrement(type: DateSegmentType): void;
    /**
     * Increments the given segment by a larger amount, rounding it to the nearest increment.
     * The amount to increment by depends on the field, for example 15 minutes, 7 days, and 5 years.
     * Upon reaching the minimum or maximum value, the value wraps around to the opposite limit.
     */
    incrementPage(type: DateSegmentType): void;
    /**
     * Decrements the given segment by a larger amount, rounding it to the nearest increment.
     * The amount to decrement by depends on the field, for example 15 minutes, 7 days, and 5 years.
     * Upon reaching the minimum or maximum value, the value wraps around to the opposite limit.
     */
    decrementPage(type: DateSegmentType): void;
    /** Increments the given segment to its maxiumum value. */
    incrementToMax(type: DateSegmentType): void;
    /** Decrements the given segment to its minimum value. */
    decrementToMin(type: DateSegmentType): void;
    /** Sets the value of the given segment. */
    setSegment(type: 'era', value: string): void;
    setSegment(type: DateSegmentType, value: number): void;
    /** Updates the remaining unfilled segments with the placeholder value. */
    confirmPlaceholder(): void;
    /** Clears the value of the given segment, reverting it to the placeholder. */
    clearSegment(type: DateSegmentType): void;
    /** Formats the current date value using the given options. */
    formatValue(fieldOptions: FieldOptions): string;
    /** Gets a formatter based on state's props. */
    getDateFormatter(locale: string, formatOptions: FormatterOptions): DateFormatter;
}
export interface DateFieldStateOptions<T extends DateValue = DateValue> extends DatePickerProps<T> {
    /**
     * The maximum unit to display in the date field.
     *
     * @default 'year'
     */
    maxGranularity?: 'year' | 'month' | Granularity;
    /** The locale to display and edit the value according to. */
    locale: string;
    /**
     * A function that creates a [Calendar](../internationalized/date/Calendar.html)
     * object for a given calendar identifier. Such a function may be imported from the
     * `@internationalized/date` package, or manually implemented to include support for
     * only certain calendars.
     */
    createCalendar: (name: CalendarIdentifier) => Calendar;
}
/**
 * Provides state management for a date field component.
 * A date field allows users to enter and edit date and time values using a keyboard.
 * Each part of a date value is displayed in an individually editable segment.
 */
export declare function useDateFieldState<T extends DateValue = DateValue>(props: DateFieldStateOptions<T>): DateFieldState;
