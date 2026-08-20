import { CheckboxGroupState } from 'react-stately/useCheckboxGroupState';
interface CheckboxGroupData {
    name?: string;
    form?: string;
    descriptionId?: string;
    errorMessageId?: string;
    validationBehavior: 'aria' | 'native';
}
export declare const checkboxGroupData: WeakMap<CheckboxGroupState, CheckboxGroupData>;
export {};
