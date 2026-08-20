import { Calendar, CalendarDate, CalendarIdentifier, DateDuration } from '@internationalized/date';
import { CalendarPropsBase, DateValue, MappedDateValue, RangeCalendarState } from './types';
import { RangeValue, ValueBase } from '@react-types/shared';
export type DateRange = RangeValue<DateValue> | null;
export interface RangeCalendarProps<T extends DateValue> extends CalendarPropsBase, ValueBase<RangeValue<T> | null, RangeValue<MappedDateValue<T>>> {
    /**
     * When combined with `isDateUnavailable`, determines whether non-contiguous ranges,
     * i.e. ranges containing unavailable dates, may be selected.
     */
    allowsNonContiguousRanges?: boolean;
    /**
     * Callback that is called for each date of the calendar. If it returns true, then the date is
     * unavailable. The second argument provides the current selection anchor date, if any. This can
     * be used to adjust the available dates based on the user's first selected date.
     */
    isDateUnavailable?: (date: DateValue, anchorDate: CalendarDate | null) => boolean;
}
export interface RangeCalendarStateOptions<T extends DateValue = DateValue> extends RangeCalendarProps<T> {
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
 * Provides state management for a range calendar component. A range calendar displays one or more
 * date grids and allows users to select a contiguous range of dates.
 */
export declare function useRangeCalendarState<T extends DateValue = DateValue>(props: RangeCalendarStateOptions<T>): RangeCalendarState<T>;
