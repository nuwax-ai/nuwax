import { CalendarDate } from '@internationalized/date';
import { CalendarSelectionMode, CalendarState } from 'react-stately/useCalendarState';
import { Key } from '@react-types/shared';
import { RangeCalendarState } from 'react-stately/useRangeCalendarState';
export interface CalendarYearPickerFormatOptions {
    year?: 'numeric' | '2-digit';
    era?: 'long' | 'short' | 'narrow';
}
export interface CalendarYearPickerProps {
    /**
     * The number of years to display.
     *
     * @default 20
     */
    visibleYears?: number;
    /**
     * The format to display.
     */
    format?: CalendarYearPickerFormatOptions;
}
export interface CalendarYearPickerAria {
    'aria-label': string;
    value: Key;
    onChange: (key: Key | null) => void;
    items: CalendarYearPickerItem[];
}
export interface CalendarYearPickerItem {
    id: number;
    date: CalendarDate;
    formatted: string;
}
export declare function useCalendarYearPicker(props: CalendarYearPickerProps, state: CalendarState<CalendarSelectionMode> | RangeCalendarState): CalendarYearPickerAria;
