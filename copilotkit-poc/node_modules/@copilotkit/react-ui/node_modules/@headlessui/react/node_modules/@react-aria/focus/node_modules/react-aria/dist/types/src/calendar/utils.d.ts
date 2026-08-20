import { CalendarDate } from '@internationalized/date';
import { CalendarSelectionMode, CalendarState } from 'react-stately/useCalendarState';
import { RangeCalendarState } from 'react-stately/useRangeCalendarState';
interface HookData {
    ariaLabel?: string;
    ariaLabelledBy?: string;
    errorMessageId: string;
    selectedDateDescription: string;
}
export declare const hookData: WeakMap<CalendarState<CalendarSelectionMode> | RangeCalendarState, HookData>;
export declare function getEraFormat(date: CalendarDate | undefined): 'short' | undefined;
export declare function useSelectedDateDescription(state: CalendarState<'single' | 'multiple'> | RangeCalendarState): string;
export declare function useVisibleRangeDescription(startDate: CalendarDate, endDate: CalendarDate, timeZone: string, isAria: boolean): string;
export {};
