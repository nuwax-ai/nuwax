import { Color, ColorChannel, ColorSpace } from './types';
import { ColorFieldProps } from './useColorFieldState';
import { NumberFieldState } from '../numberfield/useNumberFieldState';
export interface ColorChannelFieldProps extends ColorFieldProps {
    colorSpace?: ColorSpace;
    channel: ColorChannel;
}
export interface ColorChannelFieldStateOptions extends ColorChannelFieldProps {
    locale: string;
}
export interface ColorChannelFieldState extends NumberFieldState {
    /** The current value of the field. */
    colorValue: Color;
    /** The default value of the field. */
    defaultColorValue: Color | null;
    /** Sets the color value of the field. */
    setColorValue(value: Color | null): void;
}
/**
 * Provides state management for a color channel field, allowing users to edit the
 * value of an individual color channel.
 */
export declare function useColorChannelFieldState(props: ColorChannelFieldStateOptions): ColorChannelFieldState;
