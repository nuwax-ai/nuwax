import { AnyCalendarDate, CalendarIdentifier } from '../types';
import { CalendarDate } from '../CalendarDate';
import { GregorianCalendar } from './GregorianCalendar';
import { Mutable } from '../utils';
/**
 * The Taiwanese calendar is the same as the Gregorian calendar, but years
 * are numbered starting from 1912 (Gregorian). Two eras are supported:
 * 'before_minguo' and 'minguo'.
 */
export declare class TaiwanCalendar extends GregorianCalendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    getEras(): string[];
    balanceDate(date: Mutable<AnyCalendarDate>): void;
    isInverseEra(date: AnyCalendarDate): boolean;
    getDaysInMonth(date: AnyCalendarDate): number;
    getYearsInEra(date: AnyCalendarDate): number;
}
