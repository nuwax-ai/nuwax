import { AriaTextFieldProps, TextFieldAria } from './useTextField';
import { RefObject } from '@react-types/shared';
interface FormattedTextFieldState {
    validate: (val: string) => boolean;
    setInputValue: (val: string) => void;
}
export declare function useFormattedTextField(props: AriaTextFieldProps, state: FormattedTextFieldState, inputRef: RefObject<HTMLInputElement | null>): TextFieldAria;
export {};
