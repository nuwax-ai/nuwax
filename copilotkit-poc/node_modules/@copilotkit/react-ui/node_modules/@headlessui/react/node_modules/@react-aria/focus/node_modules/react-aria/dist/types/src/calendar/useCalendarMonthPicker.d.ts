import { CalendarDate } from '@internationalized/date';
import { CalendarSelectionMode, CalendarState } from 'react-stately/useCalendarState';
import { Key } from '@react-types/shared';
import { RangeCalendarState } from 'react-stately/useRangeCalendarState';
export interface CalendarMonthPickerProps {
    /**
     * The format of the month.
     */
    format?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
}
export interface CalendarMonthPickerAria {
    'aria-label': string;
    value: Key;
    onChange: (key: Key | null) => void;
    items: CalendarMonthPickerItem[];
}
export interface CalendarMonthPickerItem {
    id: number;
    date: CalendarDate;
    formatted: string;
}
export declare function useCalendarMonthPicker(props: CalendarMonthPickerProps, state: CalendarState<CalendarSelectionMode> | RangeCalendarState): CalendarMonthPickerAria;
