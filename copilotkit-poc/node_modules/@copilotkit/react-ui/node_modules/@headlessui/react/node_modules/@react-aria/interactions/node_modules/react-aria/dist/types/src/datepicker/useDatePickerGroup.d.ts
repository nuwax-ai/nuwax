import { DateFieldState } from 'react-stately/useDateFieldState';
import { DatePickerState } from 'react-stately/useDatePickerState';
import { DateRangePickerState } from 'react-stately/useDateRangePickerState';
import { DOMAttributes, FocusableElement, RefObject } from '@react-types/shared';
export declare function useDatePickerGroup(state: DatePickerState | DateRangePickerState | DateFieldState, ref: RefObject<Element | null>, disableArrowNavigation?: boolean): DOMAttributes<FocusableElement>;
