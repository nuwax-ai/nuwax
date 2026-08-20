import { FocusEvents, HelpTextProps, InputBase, InputDOMProps, LabelableProps, Orientation, Validation, ValidationState, ValueBase } from '@react-types/shared';
import { FormValidationState } from '../form/useFormValidationState';
export interface RadioGroupProps extends ValueBase<string | null, string>, InputBase, Pick<InputDOMProps, 'name'>, Validation<string>, LabelableProps, HelpTextProps, FocusEvents {
    /**
     * The axis the Radio Button(s) should align with.
     *
     * @default 'vertical'
     */
    orientation?: Orientation;
}
export interface RadioGroupState extends FormValidationState {
    /**
     * The name for the group, used for native form submission.
     *
     * @private
     * @deprecated
     */
    readonly name: string;
    /** Whether the radio group is disabled. */
    readonly isDisabled: boolean;
    /** Whether the radio group is read only. */
    readonly isReadOnly: boolean;
    /** Whether the radio group is required. */
    readonly isRequired: boolean;
    /**
     * Whether the radio group is valid or invalid.
     *
     * @deprecated Use `isInvalid` instead.
     */
    readonly validationState: ValidationState | null;
    /** Whether the radio group is invalid. */
    readonly isInvalid: boolean;
    /** The currently selected value. */
    readonly selectedValue: string | null;
    /** The default selected value. */
    readonly defaultSelectedValue: string | null;
    /** Sets the selected value. */
    setSelectedValue(value: string | null): void;
    /** The value of the last focused radio. */
    readonly lastFocusedValue: string | null;
    /** Sets the last focused value. */
    setLastFocusedValue(value: string | null): void;
}
/**
 * Provides state management for a radio group component. Provides a name for the group,
 * and manages selection and focus state.
 */
export declare function useRadioGroupState(props: RadioGroupProps): RadioGroupState;
