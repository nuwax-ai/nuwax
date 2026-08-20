import { AriaButtonProps } from '../button/useButton';
import { AriaLabelingProps, DOMAttributes, DOMProps } from '@react-types/shared';
import { CalendarPropsBase, CalendarSelectionMode, CalendarState } from 'react-stately/useCalendarState';
import { RangeCalendarState } from 'react-stately/useRangeCalendarState';
export interface CalendarAria {
    /** Props for the calendar grouping element. */
    calendarProps: DOMAttributes;
    /** Props for the next button. */
    nextButtonProps: AriaButtonProps;
    /** Props for the previous button. */
    prevButtonProps: AriaButtonProps;
    /** Props for the error message element, if any. */
    errorMessageProps: DOMAttributes;
    /** A description of the visible date range, for use in the calendar title. */
    title: string;
}
export declare function useCalendarBase(props: CalendarPropsBase & DOMProps & AriaLabelingProps, state: CalendarState<CalendarSelectionMode> | RangeCalendarState): CalendarAria;
