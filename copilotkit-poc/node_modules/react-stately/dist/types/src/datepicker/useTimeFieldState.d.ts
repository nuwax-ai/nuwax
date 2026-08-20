import { DateFieldState } from './useDateFieldState';
import { TimePickerProps, TimeValue } from './types';
import { Time } from '@internationalized/date';
export interface TimeFieldStateOptions<T extends TimeValue = TimeValue> extends TimePickerProps<T> {
    /** The locale to display and edit the value according to. */
    locale: string;
}
export interface TimeFieldState extends DateFieldState {
    /** The current time value. */
    timeValue: Time;
}
/**
 * Provides state management for a time field component.
 * A time field allows users to enter and edit time values using a keyboard.
 * Each part of a time value is displayed in an individually editable segment.
 */
export declare function useTimeFieldState<T extends TimeValue = TimeValue>(props: TimeFieldStateOptions<T>): TimeFieldState;
