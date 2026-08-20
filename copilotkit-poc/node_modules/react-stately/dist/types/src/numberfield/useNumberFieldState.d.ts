import { FocusableProps, HelpTextProps, InputBase, LabelableProps, RangeInputBase, TextInputBase, Validation, ValueBase } from '@react-types/shared';
import { FormValidationState } from '../form/useFormValidationState';
export interface NumberFieldProps extends InputBase, Validation<number>, FocusableProps, TextInputBase, ValueBase<number>, RangeInputBase<number>, LabelableProps, HelpTextProps {
    /**
     * Formatting options for the value displayed in the number field.
     * This also affects what characters are allowed to be typed by the user.
     */
    formatOptions?: Intl.NumberFormatOptions;
    /**
     * Controls the behavior of the number field when the user blurs the field after editing. 'snap'
     * will clamp the value to the min/max values, and snap to the nearest step value. 'validate' will
     * not clamp the value, and will validate that the value is within the min/max range and on a
     * valid step.
     *
     * @default 'snap'
     */
    commitBehavior?: 'snap' | 'validate';
}
export interface NumberFieldState extends FormValidationState {
    /**
     * The current text value of the input. Updated as the user types,
     * and formatted according to `formatOptions` on blur.
     */
    inputValue: string;
    /**
     * The currently parsed number value, or NaN if a valid number could not be parsed.
     * Updated based on the `inputValue` as the user types.
     */
    numberValue: number;
    /** The default value of the input. */
    defaultNumberValue: number;
    /** The minimum value of the number field. */
    minValue?: number;
    /** The maximum value of the number field. */
    maxValue?: number;
    /** Whether the current value can be incremented according to the maximum value and step. */
    canIncrement: boolean;
    /** Whether the current value can be decremented according to the minimum value and step. */
    canDecrement: boolean;
    /**
     * Validates a user input string according to the current locale and format options. Values can be
     * partially entered, and may be valid even if they cannot currently be parsed to a number. Can be
     * used to implement validation as a user types.
     */
    validate(value: string): boolean;
    /** Sets the current text value of the input. */
    setInputValue(val: string): void;
    /** Sets the number value. */
    setNumberValue(val: number): void;
    /**
     * Commits the current input value. The value is parsed to a number, clamped according to the
     * minimum and maximum values of the field, and snapped to the nearest step value. This will fire
     * the `onChange` prop with the new value, and if uncontrolled, update the `numberValue`.
     * Typically this is called when the field is blurred.
     *
     * @param value - The value to commit. If not provided, the current input value is used.
     */
    commit(value?: string): void;
    /** Increments the current input value to the next step boundary, and fires `onChange`. */
    increment(): void;
    /** Decrements the current input value to the next step boundary, and fires `onChange`. */
    decrement(): void;
    /** Sets the current value to the `maxValue` if any, and fires `onChange`. */
    incrementToMax(): void;
    /** Sets the current value to the `minValue` if any, and fires `onChange`. */
    decrementToMin(): void;
}
export interface NumberFieldStateOptions extends NumberFieldProps {
    /**
     * The locale that should be used for parsing.
     *
     * @default 'en-US'
     */
    locale: string;
}
/**
 * Provides state management for a number field component. Number fields allow users to enter a
 * number, and increment or decrement the value using stepper buttons.
 */
export declare function useNumberFieldState(props: NumberFieldStateOptions): NumberFieldState;
