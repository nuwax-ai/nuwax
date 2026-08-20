import { Color, ColorChannel, ColorSpace } from './types';
import { ValueBase } from '@react-types/shared';
export interface ColorAreaProps extends Omit<ValueBase<string | Color>, 'onChange'> {
    /**
     * The color space that the color area operates in. The `xChannel` and `yChannel` must be in this
     * color space. If not provided, this defaults to the color space of the `color` or `defaultColor`
     * value.
     */
    colorSpace?: ColorSpace;
    /** Color channel for the horizontal axis. */
    xChannel?: ColorChannel;
    /** Color channel for the vertical axis. */
    yChannel?: ColorChannel;
    /** Whether the ColorArea is disabled. */
    isDisabled?: boolean;
    /** Handler that is called when the value changes, as the user drags. */
    onChange?: (value: Color) => void;
    /** Handler that is called when the user stops dragging. */
    onChangeEnd?: (value: Color) => void;
}
export interface ColorAreaState {
    /** The current color value displayed by the color area. */
    readonly value: Color;
    /** The default value of the color area. */
    readonly defaultValue: Color;
    /** Sets the current color value. If a string is passed, it will be parsed to a Color. */
    setValue(value: string | Color): void;
    /** The current value of the horizontal axis channel displayed by the color area. */
    xValue: number;
    /**
     * Sets the value for the horizontal axis channel displayed by the color area, and triggers
     * `onChange`.
     */
    setXValue(value: number): void;
    /** The current value of the vertical axis channel displayed by the color area. */
    yValue: number;
    /**
     * Sets the value for the vertical axis channel displayed by the color area, and triggers
     * `onChange`.
     */
    setYValue(value: number): void;
    /**
     * Sets the x and y channels of the current color value based on a percentage of the width and
     * height of the color area, and triggers `onChange`.
     */
    setColorFromPoint(x: number, y: number): void;
    /**
     * Returns the coordinates of the thumb relative to the upper left corner of the color area as a
     * percentage.
     */
    getThumbPosition(): {
        x: number;
        y: number;
    };
    /** Increments the value of the horizontal axis channel by the channel step or page amount. */
    incrementX(stepSize?: number): void;
    /** Decrements the value of the horizontal axis channel by the channel step or page amount. */
    decrementX(stepSize?: number): void;
    /** Increments the value of the vertical axis channel by the channel step or page amount. */
    incrementY(stepSize?: number): void;
    /** Decrements the value of the vertical axis channel by the channel step or page amount. */
    decrementY(stepSize?: number): void;
    /** Whether the color area is currently being dragged. */
    readonly isDragging: boolean;
    /** Sets whether the color area is being dragged. */
    setDragging(value: boolean): void;
    /** Returns the xChannel, yChannel and zChannel names based on the color value. */
    channels: {
        xChannel: ColorChannel;
        yChannel: ColorChannel;
        zChannel: ColorChannel;
    };
    /** The step value of the xChannel, used when incrementing and decrementing. */
    xChannelStep: number;
    /** The step value of the yChannel, used when incrementing and decrementing. */
    yChannelStep: number;
    /** The page step value of the xChannel, used when incrementing and decrementing. */
    xChannelPageStep: number;
    /** The page step value of the yChannel, used when incrementing and decrementing. */
    yChannelPageStep: number;
    /** Returns the color that should be displayed in the color area thumb instead of `value`. */
    getDisplayColor(): Color;
}
/**
 * Provides state management for a color area component. Color area allows users to adjust two
 * channels of an HSL, HSB or RGB color value against a two-dimensional gradient background.
 */
export declare function useColorAreaState(props: ColorAreaProps): ColorAreaState;
