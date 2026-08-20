import { CalendarSelectionMode, CalendarState } from 'react-stately/useCalendarState';
import { DateDuration } from '@internationalized/date';
import { RangeCalendarState } from 'react-stately/useRangeCalendarState';
export interface CalendarHeadingFormatOptions {
    day?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    year?: 'numeric' | '2-digit';
    era?: 'long' | 'short' | 'narrow';
}
export interface CalendarHeadingProps {
    /**
     * The number of months from the start of the visible range to display.
     *
     * @default 0
     */
    offset?: DateDuration;
    /**
     * The format of the month heading.
     */
    format?: CalendarHeadingFormatOptions;
}
export declare function useCalendarHeading(props: CalendarHeadingProps, state: CalendarState<CalendarSelectionMode> | RangeCalendarState): string;
