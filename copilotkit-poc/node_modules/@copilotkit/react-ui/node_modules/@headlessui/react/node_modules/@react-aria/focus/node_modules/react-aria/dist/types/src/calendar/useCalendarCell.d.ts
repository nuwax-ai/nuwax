import { CalendarDate } from '@internationalized/date';
import { CalendarSelectionMode, CalendarState } from 'react-stately/useCalendarState';
import { DOMAttributes, RefObject } from '@react-types/shared';
import { RangeCalendarState } from 'react-stately/useRangeCalendarState';
export interface AriaCalendarCellProps {
    /** The date that this cell represents. */
    date: CalendarDate;
    /**
     * Whether the cell is disabled. By default, this is determined by the
     * Calendar's `minValue`, `maxValue`, and `isDisabled` props.
     */
    isDisabled?: boolean;
    /**
     * Whether the cell is outside of the current month.
     */
    isOutsideMonth?: boolean;
}
export interface CalendarCellAria {
    /** Props for the grid cell element (e.g. `<td>`). */
    cellProps: DOMAttributes;
    /** Props for the button element within the cell. */
    buttonProps: DOMAttributes;
    /** Whether the cell is currently being pressed. */
    isPressed: boolean;
    /** Whether the cell is selected. */
    isSelected: boolean;
    /** Whether the cell is focused. */
    isFocused: boolean;
    /**
     * Whether the cell is disabled, according to the calendar's `minValue`, `maxValue`, and
     * `isDisabled` props. Disabled dates are not focusable, and cannot be selected by the user. They
     * are typically displayed with a dimmed appearance.
     */
    isDisabled: boolean;
    /**
     * Whether the cell is unavailable, according to the calendar's `isDateUnavailable` prop.
     * Unavailable dates remain focusable, but cannot be selected by the user. They should be
     * displayed with a visual affordance to indicate they are unavailable, such as a different color
     * or a strikethrough.
     *
     * Note that because they are focusable, unavailable dates must meet a 4.5:1 color contrast ratio,
     * [as defined by WCAG](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html).
     */
    isUnavailable: boolean;
    /**
     * Whether the cell is outside the visible range of the calendar.
     * For example, dates before the first day of a month in the same week.
     */
    isOutsideVisibleRange: boolean;
    /** Whether the cell is part of an invalid selection. */
    isInvalid: boolean;
    /** The day number formatted according to the current locale. */
    formattedDate: string;
}
/**
 * Provides the behavior and accessibility implementation for a calendar cell component.
 * A calendar cell displays a date cell within a calendar grid which can be selected by the user.
 */
export declare function useCalendarCell(props: AriaCalendarCellProps, state: CalendarState<CalendarSelectionMode> | RangeCalendarState, ref: RefObject<HTMLElement | null>): CalendarCellAria;
