import { FocusableProps, HelpTextProps, InputBase, LabelableProps, TextInputBase, Validation, ValueBase } from '@react-types/shared';
export interface TextFieldProps<T = HTMLInputElement> extends InputBase, Validation<string>, HelpTextProps, FocusableProps<T>, TextInputBase, ValueBase<string>, LabelableProps {
}
export interface SearchFieldProps extends TextFieldProps {
    /** Handler that is called when the SearchField is submitted. */
    onSubmit?: (value: string) => void;
    /** Handler that is called when the clear button is pressed. */
    onClear?: () => void;
}
export interface SearchFieldState {
    /** The current value of the search field. */
    readonly value: string;
    /** Sets the value of the search field. */
    setValue(value: string): void;
}
/**
 * Provides state management for a search field.
 */
export declare function useSearchFieldState(props: SearchFieldProps): SearchFieldState;
