import { AnyCalendarDate, AnyTime, Calendar } from './types';
import { CalendarDate, CalendarDateTime, DateValue, ZonedDateTime } from './CalendarDate';
/** Returns whether the given dates occur on the same day, regardless of the time or calendar system. */
export declare function isSameDay(a: DateValue, b: DateValue): boolean;
/**
 * Returns whether the given dates occur in the same month, using the calendar system of the first
 * date.
 */
export declare function isSameMonth(a: DateValue, b: DateValue): boolean;
/**
 * Returns whether the given dates occur in the same year, using the calendar system of the first
 * date.
 */
export declare function isSameYear(a: DateValue, b: DateValue): boolean;
/** Returns whether the given dates occur on the same day, and are of the same calendar system. */
export declare function isEqualDay(a: DateValue, b: DateValue): boolean;
/** Returns whether the given dates occur in the same month, and are of the same calendar system. */
export declare function isEqualMonth(a: DateValue, b: DateValue): boolean;
/** Returns whether the given dates occur in the same year, and are of the same calendar system. */
export declare function isEqualYear(a: DateValue, b: DateValue): boolean;
/** Returns whether two calendars are the same. */
export declare function isEqualCalendar(a: Calendar, b: Calendar): boolean;
/** Returns whether the date is today in the given time zone. */
export declare function isToday(date: DateValue, timeZone: string): boolean;
type DayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
/**
 * Returns the day of week for the given date and locale. Days are numbered from zero to six,
 * where zero is the first day of the week in the given locale. For example, in the United States,
 * the first day of the week is Sunday, but in France it is Monday.
 */
export declare function getDayOfWeek(date: DateValue, locale: string, firstDayOfWeek?: DayOfWeek): number;
/** Returns the current time in the given time zone. */
export declare function now(timeZone: string): ZonedDateTime;
/** Returns today's date in the given time zone. */
export declare function today(timeZone: string): CalendarDate;
export declare function compareDate(a: AnyCalendarDate, b: AnyCalendarDate): number;
export declare function compareTime(a: AnyTime, b: AnyTime): number;
/**
 * Returns the number of hours in the given date and time zone.
 * Usually this is 24, but it could be 23 or 25 if the date is on a daylight saving transition.
 */
export declare function getHoursInDay(a: CalendarDate, timeZone: string): number;
/** Returns the time zone identifier for the current user. */
export declare function getLocalTimeZone(): string;
/** Sets the time zone identifier for the current user. */
export declare function setLocalTimeZone(timeZone: string): void;
/** Resets the time zone identifier for the current user. */
export declare function resetLocalTimeZone(): void;
/** Returns whether the local time zone has been explicitly overridden via `setLocalTimeZone`. */
export declare function isLocalTimeZoneOverridden(): boolean;
/** Returns the first date of the month for the given date. */
export declare function startOfMonth(date: ZonedDateTime): ZonedDateTime;
export declare function startOfMonth(date: CalendarDateTime): CalendarDateTime;
export declare function startOfMonth(date: CalendarDate): CalendarDate;
export declare function startOfMonth(date: DateValue): DateValue;
/** Returns the last date of the month for the given date. */
export declare function endOfMonth(date: ZonedDateTime): ZonedDateTime;
export declare function endOfMonth(date: CalendarDateTime): CalendarDateTime;
export declare function endOfMonth(date: CalendarDate): CalendarDate;
export declare function endOfMonth(date: DateValue): DateValue;
/** Returns the first day of the year for the given date. */
export declare function startOfYear(date: ZonedDateTime): ZonedDateTime;
export declare function startOfYear(date: CalendarDateTime): CalendarDateTime;
export declare function startOfYear(date: CalendarDate): CalendarDate;
export declare function startOfYear(date: DateValue): DateValue;
/** Returns the last day of the year for the given date. */
export declare function endOfYear(date: ZonedDateTime): ZonedDateTime;
export declare function endOfYear(date: CalendarDateTime): CalendarDateTime;
export declare function endOfYear(date: CalendarDate): CalendarDate;
export declare function endOfYear(date: DateValue): DateValue;
export declare function getMinimumMonthInYear(date: AnyCalendarDate): number;
export declare function getMinimumDayInMonth(date: AnyCalendarDate): number;
/** Returns the first date of the week for the given date and locale. */
export declare function startOfWeek(date: ZonedDateTime, locale: string, firstDayOfWeek?: DayOfWeek): ZonedDateTime;
export declare function startOfWeek(date: CalendarDateTime, locale: string, firstDayOfWeek?: DayOfWeek): CalendarDateTime;
export declare function startOfWeek(date: CalendarDate, locale: string, firstDayOfWeek?: DayOfWeek): CalendarDate;
export declare function startOfWeek(date: DateValue, locale: string, firstDayOfWeek?: DayOfWeek): DateValue;
/** Returns the last date of the week for the given date and locale. */
export declare function endOfWeek(date: ZonedDateTime, locale: string, firstDayOfWeek?: DayOfWeek): ZonedDateTime;
export declare function endOfWeek(date: CalendarDateTime, locale: string, firstDayOfWeek?: DayOfWeek): CalendarDateTime;
export declare function endOfWeek(date: CalendarDate, locale: string, firstDayOfWeek?: DayOfWeek): CalendarDate;
export declare function endOfWeek(date: DateValue, locale: string, firstDayOfWeek?: DayOfWeek): DateValue;
/** Returns the number of weeks in the given month and locale. */
export declare function getWeeksInMonth(date: DateValue, locale: string, firstDayOfWeek?: DayOfWeek): number;
/** Returns the lesser of the two provider dates. */
export declare function minDate<A extends DateValue, B extends DateValue>(a?: A | null, b?: B | null): A | B | null | undefined;
/** Returns the greater of the two provider dates. */
export declare function maxDate<A extends DateValue, B extends DateValue>(a?: A | null, b?: B | null): A | B | null | undefined;
/** Returns whether the given date is on a weekend in the given locale. */
export declare function isWeekend(date: DateValue, locale: string): boolean;
/** Returns whether the given date is on a weekday in the given locale. */
export declare function isWeekday(date: DateValue, locale: string): boolean;
export {};
