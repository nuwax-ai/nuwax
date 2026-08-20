import { AnyDateTime, Calendar } from '@internationalized/date';
import { DateSegmentType } from './useDateFieldState';
import { DateValue } from './types';
type HourCycle = 'h12' | 'h11' | 'h23' | 'h24';
/**
 * This class represents a date that is incomplete or otherwise invalid as a result of user editing.
 * For example, it can represent temporary dates such as February 31st if the user edits the day
 * before the month. Times are represented according to an hour cycle rather than always in 24 hour
 * time. This enables the user to adjust the day period (e.g. am/pm) independently from the hour.
 */
export declare class IncompleteDate {
    calendar: Calendar;
    era: string | null;
    year: number | null;
    month: number | null;
    day: number | null;
    hour: number | null;
    hourCycle: HourCycle;
    dayPeriod: number | null;
    minute: number | null;
    second: number | null;
    millisecond: number | null;
    offset: number | null;
    constructor(calendar: Calendar, hourCycle: HourCycle, dateValue?: Partial<Omit<AnyDateTime, 'copy'>> | null);
    copy(): IncompleteDate;
    /** Checks whether all the specified segments have a value. */
    isComplete(segments: DateSegmentType[]): boolean;
    /** Checks whether the given date value matches this value for the specified segments. */
    validate(dt: DateValue, segments: DateSegmentType[]): boolean;
    /** Checks if the date is empty (i.e. all specified segments are null). */
    isCleared(segments: DateSegmentType[]): boolean;
    /** Sets the given field. */
    set(field: DateSegmentType, value: number | string, placeholder: DateValue): IncompleteDate;
    /** Sets the given field to null. */
    clear(field: DateSegmentType): IncompleteDate;
    /**
     * Increments or decrements the given field. If it is null, then it is set to the placeholder
     * value.
     */
    cycle(field: DateSegmentType, amount: number, placeholder: DateValue, displaySegments: DateSegmentType[]): IncompleteDate;
    /**
     * Converts the incomplete date to a full date value, using the provided value for any unset
     * fields.
     */
    toValue(value: DateValue): DateValue;
    getSegmentLimits(type: string): {
        value: number | null;
        minValue: number;
        maxValue: number;
    } | undefined;
}
export {};
