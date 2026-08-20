import { AnyCalendarDate, CalendarIdentifier } from '../types';
import { CalendarDate } from '../CalendarDate';
import { GregorianCalendar } from './GregorianCalendar';
/**
 * The Buddhist calendar is the same as the Gregorian calendar, but counts years
 * starting from the birth of Buddha in 543 BC (Gregorian). It supports only one
 * era, identified as 'BE'.
 */
export declare class BuddhistCalendar extends GregorianCalendar {
    identifier: CalendarIdentifier;
    fromJulianDay(jd: number): CalendarDate;
    toJulianDay(date: AnyCalendarDate): number;
    getEras(): string[];
    getDaysInMonth(date: AnyCalendarDate): number;
    balanceDate(): void;
}
