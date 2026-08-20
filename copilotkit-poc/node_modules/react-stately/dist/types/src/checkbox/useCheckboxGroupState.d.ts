import { FormValidationState } from '../form/useFormValidationState';
import { HelpTextProps, InputBase, InputDOMProps, LabelableProps, Validation, ValidationResult, ValidationState, ValueBase } from '@react-types/shared';
export interface CheckboxGroupProps extends ValueBase<string[]>, Pick<InputDOMProps, 'name'>, InputBase, LabelableProps, HelpTextProps, Validation<string[]> {
}
export interface CheckboxGroupState extends FormValidationState {
    /** Current selected values. */
    readonly value: readonly string[];
    /** Default selected values. */
    readonly defaultValue: readonly string[];
    /** Whether the checkbox group is disabled. */
    readonly isDisabled: boolean;
    /** Whether the checkbox group is read only. */
    readonly isReadOnly: boolean;
    /**
     * The current validation state of the checkbox group.
     *
     * @deprecated Use `isInvalid` instead.
     */
    readonly validationState: ValidationState | null;
    /** Whether the checkbox group is invalid. */
    readonly isInvalid: boolean;
    /**
     * Whether the checkboxes in the group are required.
     * This changes to false once at least one item is selected.
     */
    readonly isRequired: boolean;
    /** Returns whether the given value is selected. */
    isSelected(value: string): boolean;
    /** Sets the selected values. */
    setValue(value: string[]): void;
    /** Adds a value to the set of selected values. */
    addValue(value: string): void;
    /** Removes a value from the set of selected values. */
    removeValue(value: string): void;
    /** Toggles a value in the set of selected values. */
    toggleValue(value: string): void;
    /** Sets whether one of the checkboxes is invalid. */
    setInvalid(value: string, validation: ValidationResult): void;
}
/**
 * Provides state management for a checkbox group component. Provides a name for the group,
 * and manages selection and focus state.
 */
export declare function useCheckboxGroupState(props?: CheckboxGroupProps): CheckboxGroupState;
