import { CalendarDate } from '@internationalized/date';
import { CalendarSelectionMode, CalendarState } from 'react-stately/useCalendarState';
import { DOMAttributes } from '@react-types/shared';
import { RangeCalendarState } from 'react-stately/useRangeCalendarState';
export interface AriaCalendarGridProps {
    /**
     * The first date displayed in the calendar grid.
     * Defaults to the first visible date in the calendar.
     * Override this to display multiple date grids in a calendar.
     */
    startDate?: CalendarDate;
    /**
     * The last date displayed in the calendar grid.
     * Defaults to the last visible date in the calendar.
     * Override this to display multiple date grids in a calendar.
     */
    endDate?: CalendarDate;
    /**
     * The style of weekday names to display in the calendar grid header,
     * e.g. single letter, abbreviation, or full day name.
     *
     * @default 'narrow'
     */
    weekdayStyle?: 'narrow' | 'short' | 'long';
    /**
     * The day that starts the week.
     */
    firstDayOfWeek?: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
}
export interface CalendarGridAria {
    /** Props for the date grid element (e.g. `<table>`). */
    gridProps: DOMAttributes;
    /** Props for the grid header element (e.g. `<thead>`). */
    headerProps: DOMAttributes;
    /**
     * A list of week day abbreviations formatted for the current locale, typically used in column
     * headers.
     */
    weekDays: string[];
    /** The number of weeks in the month. */
    weeksInMonth: number;
}
/**
 * Provides the behavior and accessibility implementation for a calendar grid component.
 * A calendar grid displays a single grid of days within a calendar or range calendar which
 * can be keyboard navigated and selected by the user.
 */
export declare function useCalendarGrid(props: AriaCalendarGridProps, state: CalendarState<CalendarSelectionMode> | RangeCalendarState): CalendarGridAria;
