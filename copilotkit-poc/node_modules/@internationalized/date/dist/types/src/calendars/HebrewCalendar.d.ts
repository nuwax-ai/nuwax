import { AnyCalendarDate, Calendar, CalendarIdentifier } from '../types';
import { CalendarDate } from '../CalendarDate';
import { Mutable } from '../utils';
/**
 * The Hebrew calendar is used in Israel and around the world by the Jewish faith.
 * Years include either 12 or 13 months depending on whether it is a leap year.
 * In leap years, an extra month is inserted at month 6.
 */
export declare class HebrewCalendar implements Calendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    getDaysInMonth(date: AnyCalendarDate): number;
    getMonthsInYear(date: AnyCalendarDate): number;
    getDaysInYear(date: AnyCalendarDate): number;
    getMaximumMonthsInYear(): number;
    getMaximumDaysInMonth(): number;
    getYearsInEra(): number;
    getEras(): string[];
    balanceYearMonth(date: Mutable<AnyCalendarDate>, previousDate: AnyCalendarDate): void;
}
