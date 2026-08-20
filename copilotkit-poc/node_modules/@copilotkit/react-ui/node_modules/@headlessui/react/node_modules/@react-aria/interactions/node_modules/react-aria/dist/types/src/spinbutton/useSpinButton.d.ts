import { AriaButtonProps } from '../button/useButton';
import { DOMAttributes, InputBase, RangeInputBase, Validation, ValueBase } from '@react-types/shared';
export interface SpinButtonProps extends InputBase, Validation<number>, ValueBase<number>, RangeInputBase<number> {
    textValue?: string;
    onIncrement?: () => void;
    onIncrementPage?: () => void;
    onDecrement?: () => void;
    onDecrementPage?: () => void;
    onDecrementToMin?: () => void;
    onIncrementToMax?: () => void;
}
export interface SpinbuttonAria {
    spinButtonProps: DOMAttributes;
    incrementButtonProps: AriaButtonProps;
    decrementButtonProps: AriaButtonProps;
}
export declare function useSpinButton(props: SpinButtonProps): SpinbuttonAria;
