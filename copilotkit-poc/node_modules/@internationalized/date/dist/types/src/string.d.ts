import { AnyDateTime, DateTimeDuration, Disambiguation } from './types';
import { CalendarDate, CalendarDateTime, Time, ZonedDateTime } from './CalendarDate';
/** Parses an ISO 8601 time string. */
export declare function parseTime(value: string): Time;
/** Parses an ISO 8601 date string, with no time components. */
export declare function parseDate(value: string): CalendarDate;
/** Parses an ISO 8601 date and time string, with no time zone. */
export declare function parseDateTime(value: string): CalendarDateTime;
/**
 * Parses an ISO 8601 date and time string with a time zone extension and optional UTC offset (e.g.
 * "2021-11-07T00:45[America/Los_Angeles]" or "2021-11-07T00:45-07:00[America/Los_Angeles]").
 * Ambiguous times due to daylight saving time transitions are resolved according to the
 * `disambiguation` parameter.
 */
export declare function parseZonedDateTime(value: string, disambiguation?: Disambiguation): ZonedDateTime;
/**
 * Parses an ISO 8601 date and time string with a UTC offset (e.g. "2021-11-07T07:45:00Z"
 * or "2021-11-07T07:45:00-07:00"). The result is converted to the provided time zone.
 */
export declare function parseAbsolute(value: string, timeZone: string): ZonedDateTime;
/**
 * Parses an ISO 8601 date and time string with a UTC offset (e.g. "2021-11-07T07:45:00Z"
 * or "2021-11-07T07:45:00-07:00"). The result is converted to the user's local time zone.
 */
export declare function parseAbsoluteToLocal(value: string): ZonedDateTime;
export declare function timeToString(time: Time): string;
export declare function dateToString(date: CalendarDate): string;
export declare function dateTimeToString(date: AnyDateTime): string;
export declare function zonedDateTimeToString(date: ZonedDateTime): string;
/**
 * Parses an ISO 8601 duration string (e.g. "P3Y6M6W4DT12H30M5S").
 *
 * @param value An ISO 8601 duration string.
 * @returns A DateTimeDuration object.
 */
export declare function parseDuration(value: string): Required<DateTimeDuration>;
