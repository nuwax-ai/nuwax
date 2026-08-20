import { AnyCalendarDate, CalendarIdentifier } from '../types';
import { CalendarDate } from '../CalendarDate';
import { GregorianCalendar } from './GregorianCalendar';
import { Mutable } from '../utils';
/**
 * The Japanese calendar is based on the Gregorian calendar, but with eras for the reign of each
 * Japanese emperor. Whenever a new emperor ascends to the throne, a new era begins and the year
 * starts again from 1. Note that eras before 1868 (Gregorian) are not currently supported by this
 * implementation.
 */
export declare class JapaneseCalendar extends GregorianCalendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    balanceDate(date: Mutable<AnyCalendarDate>): void;
    constrainDate(date: Mutable<AnyCalendarDate>): void;
    getEras(): string[];
    getYearsInEra(date: AnyCalendarDate): number;
    getDaysInMonth(date: AnyCalendarDate): number;
    getMinimumMonthInYear(date: AnyCalendarDate): number;
    getMinimumDayInMonth(date: AnyCalendarDate): number;
}
