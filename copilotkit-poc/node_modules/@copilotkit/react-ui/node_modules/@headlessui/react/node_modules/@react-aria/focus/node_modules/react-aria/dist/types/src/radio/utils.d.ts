import { RadioGroupState } from 'react-stately/useRadioGroupState';
interface RadioGroupData {
    name: string;
    form: string | undefined;
    descriptionId: string | undefined;
    errorMessageId: string | undefined;
    validationBehavior: 'aria' | 'native';
}
export declare const radioGroupData: WeakMap<RadioGroupState, RadioGroupData>;
export {};
