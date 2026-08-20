import { Calendar } from '@internationalized/date';
import { DatePickerProps, DateValue, Granularity, TimeValue } from './types';
import { RangeValue, ValidationResult } from '@react-types/shared';
export declare function getValidationResult(value: DateValue | null, minValue: DateValue | null | undefined, maxValue: DateValue | null | undefined, isDateUnavailable: ((v: DateValue) => boolean) | undefined, options: FormatterOptions): ValidationResult;
export declare function getRangeValidationResult(value: RangeValue<DateValue | null> | null, minValue: DateValue | null | undefined, maxValue: DateValue | null | undefined, isDateUnavailable: ((v: DateValue) => boolean) | undefined, options: FormatterOptions): ValidationResult;
export type FieldOptions = Pick<Intl.DateTimeFormatOptions, 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'>;
export interface FormatterOptions {
    timeZone?: string;
    hideTimeZone?: boolean;
    granularity?: DatePickerProps<any>['granularity'];
    maxGranularity?: 'year' | 'month' | DatePickerProps<any>['granularity'];
    hourCycle?: 12 | 24;
    showEra?: boolean;
    shouldForceLeadingZeros?: boolean;
}
export declare function getFormatOptions(fieldOptions: FieldOptions, options: FormatterOptions): Intl.DateTimeFormatOptions;
export declare function getPlaceholderTime(placeholderValue: DateValue | null | undefined): TimeValue;
export declare function convertValue(value: DateValue | null | undefined, calendar: Calendar): DateValue | null | undefined;
export declare function createPlaceholderDate(placeholderValue: DateValue | null | undefined, granularity: string, calendar: Calendar, timeZone: string | undefined): DateValue;
export declare function useDefaultProps(v: DateValue | null, granularity: Granularity | undefined): [Granularity, string | undefined];
