import { DateFieldState, DateSegment } from 'react-stately/useDateFieldState';
import React from 'react';
import { RefObject } from '@react-types/shared';
export interface DateSegmentAria {
    /** Props for the segment element. */
    segmentProps: React.HTMLAttributes<HTMLDivElement>;
}
/**
 * Provides the behavior and accessibility implementation for a segment in a date field.
 * A date segment displays an individual unit of a date and time, and allows users to edit
 * the value by typing or using the arrow keys to increment and decrement.
 */
export declare function useDateSegment(segment: DateSegment, state: DateFieldState, ref: RefObject<HTMLElement | null>): DateSegmentAria;
