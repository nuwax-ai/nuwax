import { AriaLabelingProps, DOMProps } from '@react-types/shared';
import { CalendarAria } from './useCalendarBase';
import { CalendarProps, CalendarSelectionMode, CalendarState, DateValue } from 'react-stately/useCalendarState';
export interface AriaCalendarProps<T extends DateValue, M extends CalendarSelectionMode = 'single'> extends CalendarProps<T, M>, DOMProps, AriaLabelingProps {
}
/**
 * Provides the behavior and accessibility implementation for a calendar component.
 * A calendar displays one or more date grids and allows users to select a single date.
 */
export declare function useCalendar<T extends DateValue, M extends CalendarSelectionMode = 'single'>(props: AriaCalendarProps<T, M>, state: CalendarState<M>): CalendarAria;
