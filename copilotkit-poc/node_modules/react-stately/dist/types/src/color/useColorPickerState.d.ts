import { Color } from './types';
import { ValueBase } from '@react-types/shared';
export interface ColorPickerProps extends ValueBase<string | Color, Color> {
}
export interface ColorPickerState {
    /** The current color value of the color picker. */
    color: Color;
    /** Sets the current color value of the color picker. */
    setColor(color: Color | null): void;
}
export declare function useColorPickerState(props: ColorPickerProps): ColorPickerState;
