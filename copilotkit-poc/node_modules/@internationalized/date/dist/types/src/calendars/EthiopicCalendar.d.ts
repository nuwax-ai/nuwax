import { AnyCalendarDate, Calendar, CalendarIdentifier } from '../types';
import { CalendarDate } from '../CalendarDate';
import { Mutable } from '../utils';
/**
 * The Ethiopic calendar system is the official calendar used in Ethiopia.
 * It includes 12 months of 30 days each, plus 5 or 6 intercalary days depending
 * on whether it is a leap year. Two eras are supported: 'AA' and 'AM'.
 */
export declare class EthiopicCalendar implements Calendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    getDaysInMonth(date: AnyCalendarDate): number;
    getMonthsInYear(): number;
    getDaysInYear(date: AnyCalendarDate): number;
    getMaximumMonthsInYear(): number;
    getMaximumDaysInMonth(): number;
    getYearsInEra(date: AnyCalendarDate): number;
    getEras(): string[];
}
/**
 * The Ethiopic (Amete Alem) calendar is the same as the modern Ethiopic calendar,
 * except years were measured from a different epoch. Only one era is supported: 'AA'.
 */
export declare class EthiopicAmeteAlemCalendar extends EthiopicCalendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    getEras(): string[];
    getYearsInEra(): number;
}
/**
 * The Coptic calendar is similar to the Ethiopic calendar.
 * It includes 12 months of 30 days each, plus 5 or 6 intercalary days depending
 * on whether it is a leap year. Two eras are supported: 'BCE' and 'CE'.
 */
export declare class CopticCalendar extends EthiopicCalendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    getDaysInMonth(date: AnyCalendarDate): number;
    isInverseEra(date: AnyCalendarDate): boolean;
    balanceDate(date: Mutable<AnyCalendarDate>): void;
    getEras(): string[];
    getYearsInEra(date: AnyCalendarDate): number;
}
