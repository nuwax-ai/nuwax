import { Color, ColorChannel, ColorSpace } from './types';
import { SliderProps, SliderState } from '../slider/useSliderState';
export interface ColorSliderProps extends Omit<SliderProps<string | Color>, 'minValue' | 'maxValue' | 'step' | 'pageSize' | 'onChange' | 'onChangeEnd'> {
    /**
     * The color space that the slider operates in. The `channel` must be in this color space.
     * If not provided, this defaults to the color space of the `color` or `defaultColor` value.
     */
    colorSpace?: ColorSpace;
    /** The color channel that the slider manipulates. */
    channel: ColorChannel;
    /** Handler that is called when the value changes, as the user drags. */
    onChange?: (value: Color) => void;
    /** Handler that is called when the user stops dragging. */
    onChangeEnd?: (value: Color) => void;
}
export interface ColorSliderState extends SliderState {
    /** The current color value represented by the color slider. */
    readonly value: Color;
    /** Sets the current color value. If a string is passed, it will be parsed to a Color. */
    setValue(value: string | Color): void;
    /**
     * Returns the color that should be displayed in the slider instead of `value` or the optional
     * parameter.
     */
    getDisplayColor(): Color;
    /** Whether the color slider is currently being dragged. */
    readonly isDragging: boolean;
}
export interface ColorSliderStateOptions extends ColorSliderProps {
    /** The locale to use for formatting the color channel value. */
    locale: string;
}
/**
 * Provides state management for a color slider component.
 * Color sliders allow users to adjust an individual channel of a color value.
 */
export declare function useColorSliderState(props: ColorSliderStateOptions): ColorSliderState;
