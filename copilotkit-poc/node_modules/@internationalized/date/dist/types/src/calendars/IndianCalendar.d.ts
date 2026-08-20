import { AnyCalendarDate, CalendarIdentifier } from '../types';
import { CalendarDate } from '../CalendarDate';
import { GregorianCalendar } from './GregorianCalendar';
/**
 * The Indian National Calendar is similar to the Gregorian calendar, but with
 * years numbered since the Saka era in 78 AD (Gregorian). There are 12 months
 * in each year, with either 30 or 31 days. Only one era identifier is supported: 'saka'.
 */
export declare class IndianCalendar extends GregorianCalendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    getDaysInMonth(date: AnyCalendarDate): number;
    getYearsInEra(): number;
    getEras(): string[];
    balanceDate(): void;
}
