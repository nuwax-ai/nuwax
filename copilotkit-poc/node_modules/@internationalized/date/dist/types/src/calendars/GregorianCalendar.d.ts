import { AnyCalendarDate, Calendar, CalendarIdentifier } from '../types';
import { CalendarDate } from '../CalendarDate';
import { Mutable } from '../utils';
export declare function gregorianToJulianDay(era: string, year: number, month: number, day: number): number;
export declare function isLeapYear(year: number): boolean;
export declare function getExtendedYear(era: string, year: number): number;
export declare function fromExtendedYear(year: number): [string, number];
/**
 * The Gregorian calendar is the most commonly used calendar system in the world. It supports two
 * eras: BC, and AD. Years always contain 12 months, and 365 or 366 days depending on whether it is
 * a leap year.
 */
export declare class GregorianCalendar implements Calendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    getDaysInMonth(date: AnyCalendarDate): number;
    getMonthsInYear(date: AnyCalendarDate): number;
    getDaysInYear(date: AnyCalendarDate): number;
    getMaximumMonthsInYear(): number;
    getMaximumDaysInMonth(): number;
    getYearsInEra(date: AnyCalendarDate): number;
    getEras(): string[];
    isInverseEra(date: AnyCalendarDate): boolean;
    balanceDate(date: Mutable<AnyCalendarDate>): void;
}
