import { AriaCheckboxProps, CheckboxAria } from './useCheckbox';
import { CheckboxGroupState } from 'react-stately/useCheckboxGroupState';
import { RefObject } from '@react-types/shared';
export interface AriaCheckboxGroupItemProps extends Omit<AriaCheckboxProps, 'isSelected' | 'defaultSelected'> {
    value: string;
}
/**
 * Provides the behavior and accessibility implementation for a checkbox component contained within
 * a checkbox group. Checkbox groups allow users to select multiple items from a list of options.
 *
 * @param props - Props for the checkbox.
 * @param state - State for the checkbox, as returned by `useCheckboxGroupState`.
 * @param inputRef - A ref for the HTML input element.
 */
export declare function useCheckboxGroupItem(props: AriaCheckboxGroupItemProps, state: CheckboxGroupState, inputRef: RefObject<HTMLInputElement | null>): CheckboxAria;
