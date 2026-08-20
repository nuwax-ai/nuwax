import { AnyCalendarDate, Calendar, CalendarIdentifier } from '../types';
import { CalendarDate } from '../CalendarDate';
/**
 * The Persian calendar is the main calendar used in Iran and Afghanistan. It has 12 months
 * in each year, the first 6 of which have 31 days, and the next 5 have 30 days. The 12th month
 * has either 29 or 30 days depending on whether it is a leap year. The Persian year starts
 * around the March equinox.
 */
export declare class PersianCalendar implements Calendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    getMonthsInYear(): number;
    getDaysInMonth(date: AnyCalendarDate): number;
    getMaximumMonthsInYear(): number;
    getMaximumDaysInMonth(): number;
    getEras(): string[];
    getYearsInEra(): number;
}
