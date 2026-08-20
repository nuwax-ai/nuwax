import { Color } from './types';
import { FocusableProps, HelpTextProps, InputBase, LabelableProps, TextInputBase, Validation, ValueBase } from '@react-types/shared';
import { FormValidationState } from '../form/useFormValidationState';
export interface ColorFieldProps extends Omit<ValueBase<string | Color | null>, 'onChange'>, InputBase, Validation<Color | null>, FocusableProps, TextInputBase, LabelableProps, HelpTextProps {
    /** Handler that is called when the value changes. */
    onChange?: (color: Color | null) => void;
}
export interface ColorFieldState extends FormValidationState {
    /**
     * The current text value of the input. Updated as the user types,
     * and formatted according to `formatOptions` on blur.
     */
    readonly inputValue: string;
    /**
     * The currently parsed color value, or null if the field is empty.
     * Updated based on the `inputValue` as the user types.
     */
    readonly colorValue: Color | null;
    /** The default value of the color field. */
    readonly defaultColorValue: Color | null;
    /** Sets the color value of the field. */
    setColorValue(value: Color | null): void;
    /** Sets the current text value of the input. */
    setInputValue(value: string): void;
    /**
     * Updates the input value based on the currently parsed color value.
     * Typically this is called when the field is blurred.
     */
    commit(): void;
    /** Increments the current input value to the next step boundary, and fires `onChange`. */
    increment(): void;
    /** Decrements the current input value to the next step boundary, and fires `onChange`. */
    decrement(): void;
    /** Sets the current value to the maximum color value, and fires `onChange`. */
    incrementToMax(): void;
    /** Sets the current value to the minimum color value, and fires `onChange`. */
    decrementToMin(): void;
    /**
     * Validates a user input string. Values can be partially entered, and may be valid even if they
     * cannot currently be parsed to a color. Can be used to implement validation as a user types.
     */
    validate(value: string): boolean;
}
/**
 * Provides state management for a color field component. Color fields allow
 * users to enter and adjust a hex color value.
 */
export declare function useColorFieldState(props: ColorFieldProps): ColorFieldState;
