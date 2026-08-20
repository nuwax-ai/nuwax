import { AnyCalendarDate, AnyTime, Calendar, CycleOptions, CycleTimeOptions, DateDuration, DateField, DateFields, DateTimeDuration, Disambiguation, TimeDuration, TimeField, TimeFields } from './types';
export type DateValue = CalendarDate | CalendarDateTime | ZonedDateTime;
/** A CalendarDate represents a date without any time components in a specific calendar system. */
export declare class CalendarDate {
    #private;
    /** The calendar system associated with this date, e.g. Gregorian. */
    readonly calendar: Calendar;
    /** The calendar era for this date, e.g. "BC" or "AD". */
    readonly era: string;
    /** The year of this date within the era. */
    readonly year: number;
    /**
     * The month number within the year. Note that some calendar systems such as Hebrew
     * may have a variable number of months per year. Therefore, month numbers may not
     * always correspond to the same month names in different years.
     */
    readonly month: number;
    /** The day number within the month. */
    readonly day: number;
    constructor(year: number, month: number, day: number);
    constructor(era: string, year: number, month: number, day: number);
    constructor(calendar: Calendar, year: number, month: number, day: number);
    constructor(calendar: Calendar, era: string, year: number, month: number, day: number);
    /** Returns a copy of this date. */
    copy(): CalendarDate;
    /** Returns a new `CalendarDate` with the given duration added to it. */
    add(duration: DateDuration): CalendarDate;
    /** Returns a new `CalendarDate` with the given duration subtracted from it. */
    subtract(duration: DateDuration): CalendarDate;
    /**
     * Returns a new `CalendarDate` with the given fields set to the provided values. Other fields
     * will be constrained accordingly.
     */
    set(fields: DateFields): CalendarDate;
    /**
     * Returns a new `CalendarDate` with the given field adjusted by a specified amount.
     * When the resulting value reaches the limits of the field, it wraps around.
     */
    cycle(field: DateField, amount: number, options?: CycleOptions): CalendarDate;
    /**
     * Converts the date to a native JavaScript Date object, with the time set to midnight in the
     * given time zone.
     */
    toDate(timeZone: string): Date;
    /** Converts the date to an ISO 8601 formatted string. */
    toString(): string;
    /**
     * Compares this date with another. A negative result indicates that this date is before the given
     * one, and a positive date indicates that it is after.
     */
    compare(b: AnyCalendarDate): number;
}
/** A Time represents a clock time without any date components. */
export declare class Time {
    #private;
    /** The hour, numbered from 0 to 23. */
    readonly hour: number;
    /** The minute in the hour. */
    readonly minute: number;
    /** The second in the minute. */
    readonly second: number;
    /** The millisecond in the second. */
    readonly millisecond: number;
    constructor(hour?: number, minute?: number, second?: number, millisecond?: number);
    /** Returns a copy of this time. */
    copy(): Time;
    /** Returns a new `Time` with the given duration added to it. */
    add(duration: TimeDuration): Time;
    /** Returns a new `Time` with the given duration subtracted from it. */
    subtract(duration: TimeDuration): Time;
    /**
     * Returns a new `Time` with the given fields set to the provided values. Other fields will be
     * constrained accordingly.
     */
    set(fields: TimeFields): Time;
    /**
     * Returns a new `Time` with the given field adjusted by a specified amount.
     * When the resulting value reaches the limits of the field, it wraps around.
     */
    cycle(field: TimeField, amount: number, options?: CycleTimeOptions): Time;
    /** Converts the time to an ISO 8601 formatted string. */
    toString(): string;
    /**
     * Compares this time with another. A negative result indicates that this time is before the given
     * one, and a positive time indicates that it is after.
     */
    compare(b: AnyTime): number;
}
/** A CalendarDateTime represents a date and time without a time zone, in a specific calendar system. */
export declare class CalendarDateTime {
    #private;
    /** The calendar system associated with this date, e.g. Gregorian. */
    readonly calendar: Calendar;
    /** The calendar era for this date, e.g. "BC" or "AD". */
    readonly era: string;
    /** The year of this date within the era. */
    readonly year: number;
    /**
     * The month number within the year. Note that some calendar systems such as Hebrew
     * may have a variable number of months per year. Therefore, month numbers may not
     * always correspond to the same month names in different years.
     */
    readonly month: number;
    /** The day number within the month. */
    readonly day: number;
    /** The hour in the day, numbered from 0 to 23. */
    readonly hour: number;
    /** The minute in the hour. */
    readonly minute: number;
    /** The second in the minute. */
    readonly second: number;
    /** The millisecond in the second. */
    readonly millisecond: number;
    constructor(year: number, month: number, day: number, hour?: number, minute?: number, second?: number, millisecond?: number);
    constructor(era: string, year: number, month: number, day: number, hour?: number, minute?: number, second?: number, millisecond?: number);
    constructor(calendar: Calendar, year: number, month: number, day: number, hour?: number, minute?: number, second?: number, millisecond?: number);
    constructor(calendar: Calendar, era: string, year: number, month: number, day: number, hour?: number, minute?: number, second?: number, millisecond?: number);
    /** Returns a copy of this date. */
    copy(): CalendarDateTime;
    /** Returns a new `CalendarDateTime` with the given duration added to it. */
    add(duration: DateTimeDuration): CalendarDateTime;
    /** Returns a new `CalendarDateTime` with the given duration subtracted from it. */
    subtract(duration: DateTimeDuration): CalendarDateTime;
    /**
     * Returns a new `CalendarDateTime` with the given fields set to the provided values. Other fields
     * will be constrained accordingly.
     */
    set(fields: DateFields & TimeFields): CalendarDateTime;
    /**
     * Returns a new `CalendarDateTime` with the given field adjusted by a specified amount.
     * When the resulting value reaches the limits of the field, it wraps around.
     */
    cycle(field: DateField | TimeField, amount: number, options?: CycleTimeOptions): CalendarDateTime;
    /** Converts the date to a native JavaScript Date object in the given time zone. */
    toDate(timeZone: string, disambiguation?: Disambiguation): Date;
    /** Converts the date to an ISO 8601 formatted string. */
    toString(): string;
    /**
     * Compares this date with another. A negative result indicates that this date is before the given
     * one, and a positive date indicates that it is after.
     */
    compare(b: CalendarDate | CalendarDateTime | ZonedDateTime): number;
}
/** A ZonedDateTime represents a date and time in a specific time zone and calendar system. */
export declare class ZonedDateTime {
    #private;
    /** The calendar system associated with this date, e.g. Gregorian. */
    readonly calendar: Calendar;
    /** The calendar era for this date, e.g. "BC" or "AD". */
    readonly era: string;
    /** The year of this date within the era. */
    readonly year: number;
    /**
     * The month number within the year. Note that some calendar systems such as Hebrew
     * may have a variable number of months per year. Therefore, month numbers may not
     * always correspond to the same month names in different years.
     */
    readonly month: number;
    /** The day number within the month. */
    readonly day: number;
    /** The hour in the day, numbered from 0 to 23. */
    readonly hour: number;
    /** The minute in the hour. */
    readonly minute: number;
    /** The second in the minute. */
    readonly second: number;
    /** The millisecond in the second. */
    readonly millisecond: number;
    /** The IANA time zone identifier that this date and time is represented in. */
    readonly timeZone: string;
    /** The UTC offset for this time, in milliseconds. */
    readonly offset: number;
    constructor(year: number, month: number, day: number, timeZone: string, offset: number, hour?: number, minute?: number, second?: number, millisecond?: number);
    constructor(era: string, year: number, month: number, day: number, timeZone: string, offset: number, hour?: number, minute?: number, second?: number, millisecond?: number);
    constructor(calendar: Calendar, year: number, month: number, day: number, timeZone: string, offset: number, hour?: number, minute?: number, second?: number, millisecond?: number);
    constructor(calendar: Calendar, era: string, year: number, month: number, day: number, timeZone: string, offset: number, hour?: number, minute?: number, second?: number, millisecond?: number);
    /** Returns a copy of this date. */
    copy(): ZonedDateTime;
    /** Returns a new `ZonedDateTime` with the given duration added to it. */
    add(duration: DateTimeDuration): ZonedDateTime;
    /** Returns a new `ZonedDateTime` with the given duration subtracted from it. */
    subtract(duration: DateTimeDuration): ZonedDateTime;
    /**
     * Returns a new `ZonedDateTime` with the given fields set to the provided values. Other fields
     * will be constrained accordingly.
     */
    set(fields: DateFields & TimeFields, disambiguation?: Disambiguation): ZonedDateTime;
    /**
     * Returns a new `ZonedDateTime` with the given field adjusted by a specified amount.
     * When the resulting value reaches the limits of the field, it wraps around.
     */
    cycle(field: DateField | TimeField, amount: number, options?: CycleTimeOptions): ZonedDateTime;
    /** Converts the date to a native JavaScript Date object. */
    toDate(): Date;
    /**
     * Converts the date to an ISO 8601 formatted string, including the UTC offset and time zone
     * identifier.
     */
    toString(): string;
    /** Converts the date to an ISO 8601 formatted string in UTC. */
    toAbsoluteString(): string;
    /**
     * Compares this date with another. A negative result indicates that this date is before the given
     * one, and a positive date indicates that it is after.
     */
    compare(b: CalendarDate | CalendarDateTime | ZonedDateTime): number;
}
