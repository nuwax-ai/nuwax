import { Calendar, CalendarIdentifier, DateDuration } from '@internationalized/date';
import { CalendarPropsBase, CalendarSelectionMode, CalendarState, CalendarValueType, DateValue, MappedDateValue } from './types';
import { ValueBase } from '@react-types/shared';
export interface CalendarProps<T extends DateValue, M extends CalendarSelectionMode = 'single'> extends CalendarPropsBase, ValueBase<CalendarValueType<T | null, M>, CalendarValueType<MappedDateValue<T>, M>> {
    /**
     * Whether single or multiple selection is enabled.
     *
     * @default 'single'
     */
    selectionMode?: M;
    /**
     * Callback that is called for each date of the calendar. If it returns true, then the date is
     * unavailable.
     */
    isDateUnavailable?: (date: DateValue) => boolean;
}
export interface CalendarStateOptions<T extends DateValue = DateValue, M extends CalendarSelectionMode = 'single'> extends CalendarProps<T, M> {
    /** The locale to display and edit the value according to. */
    locale: string;
    /**
     * A function that creates a [Calendar](../internationalized/date/Calendar.html)
     * object for a given calendar identifier. Such a function may be imported from the
     * `@internationalized/date` package, or manually implemented to include support for
     * only certain calendars.
     */
    createCalendar: (name: CalendarIdentifier) => Calendar;
    /**
     * The amount of days that will be displayed at once. This affects how pagination works.
     *
     * @default { months: 1 }
     */
    visibleDuration?: DateDuration;
    /**
     * Determines the alignment of the visible months on initial render based on the current selection
     * or current date if there is no selection.
     *
     * @default 'center'
     */
    selectionAlignment?: 'start' | 'center' | 'end';
}
/**
 * Provides state management for a calendar component.
 * A calendar displays one or more date grids and allows users to select a single date.
 */
export declare function useCalendarState<T extends DateValue = DateValue, M extends CalendarSelectionMode = 'single'>(props: CalendarStateOptions<T, M>): CalendarState<M>;
