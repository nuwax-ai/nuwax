import { AriaLabelingProps, DOMProps, FocusableElement, RefObject } from '@react-types/shared';
import { CalendarAria } from './useCalendarBase';
import { DateValue, RangeCalendarState } from 'react-stately/useRangeCalendarState';
import { RangeCalendarProps } from 'react-stately/useRangeCalendarState';
export interface AriaRangeCalendarProps<T extends DateValue> extends RangeCalendarProps<T>, DOMProps, AriaLabelingProps {
    /**
     * Controls the behavior when a pointer is released outside the calendar or a blur occurs mid
     * selection:
     *
     * - `clear`: clear the currently selected range of dates.
     * - `reset`: reset the selection to the previously selected range of dates.
     * - `select`: select the currently hovered range of dates.
     *
     * @default 'select'
     */
    commitBehavior?: 'clear' | 'reset' | 'select';
}
/**
 * Provides the behavior and accessibility implementation for a range calendar component. A range
 * calendar displays one or more date grids and allows users to select a contiguous range of dates.
 */
export declare function useRangeCalendar<T extends DateValue>(props: AriaRangeCalendarProps<T>, state: RangeCalendarState, ref: RefObject<FocusableElement | null>): CalendarAria;
