import { LabelableProps, Orientation, RangeInputBase, ValueBase } from '@react-types/shared';
export interface SliderProps<T = number | number[]> extends RangeInputBase<number>, ValueBase<T>, LabelableProps {
    /**
     * The orientation of the Slider.
     *
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /** Whether the whole Slider is disabled. */
    isDisabled?: boolean;
    /** Fired when the slider stops moving, due to being let go. */
    onChangeEnd?: (value: T) => void;
    /**
     * The slider's minimum value.
     *
     * @default 0
     */
    minValue?: number;
    /**
     * The slider's maximum value.
     *
     * @default 100
     */
    maxValue?: number;
    /**
     * The slider's step value.
     *
     * @default 1
     */
    step?: number;
}
export interface SliderState {
    /**
     * Values managed by the slider by thumb index.
     */
    readonly values: number[];
    /**
     * The default values for each thumb.
     */
    readonly defaultValues: number[];
    /**
     * Get the value for the specified thumb.
     *
     * @param index
     */
    getThumbValue(index: number): number;
    /**
     * Sets the value for the specified thumb.
     * The actual value set will be clamped and rounded according to min/max/step.
     *
     * @param index
     * @param value
     */
    setThumbValue(index: number, value: number): void;
    /**
     * Sets value for the specified thumb by percent offset (between 0 and 1).
     *
     * @param index
     * @param percent
     */
    setThumbPercent(index: number, percent: number): void;
    /**
     * Whether the specific thumb is being dragged.
     *
     * @param index
     */
    isThumbDragging(index: number): boolean;
    /**
     * Set is dragging on the specified thumb.
     *
     * @param index
     * @param dragging
     */
    setThumbDragging(index: number, dragging: boolean): void;
    /**
     * Currently-focused thumb index.
     */
    readonly focusedThumb: number | undefined;
    /**
     * Set focused true on specified thumb. This will remove focus from
     * any thumb that had it before.
     *
     * @param index
     */
    setFocusedThumb(index: number | undefined): void;
    /**
     * Returns the specified thumb's value as a percentage from 0 to 1.
     *
     * @param index
     */
    getThumbPercent(index: number): number;
    /**
     * Returns the value as a percent between the min and max of the slider.
     *
     * @param index
     */
    getValuePercent(value: number): number;
    /**
     * Returns the string label for the specified thumb's value, per props.formatOptions.
     *
     * @param index
     */
    getThumbValueLabel(index: number): string;
    /**
     * Returns the string label for the value, per props.formatOptions.
     *
     * @param value
     */
    getFormattedValue(value?: number | number[]): string;
    /**
     * Returns the min allowed value for the specified thumb.
     *
     * @param index
     */
    getThumbMinValue(index: number): number;
    /**
     * Returns the max allowed value for the specified thumb.
     *
     * @param index
     */
    getThumbMaxValue(index: number): number;
    /**
     * Converts a percent along track (between 0 and 1) to the corresponding value.
     *
     * @param percent
     */
    getPercentValue(percent: number): number;
    /**
     * Returns if the specified thumb is editable.
     *
     * @param index
     */
    isThumbEditable(index: number): boolean;
    /**
     * Set the specified thumb's editable state.
     *
     * @param index
     * @param editable
     */
    setThumbEditable(index: number, editable: boolean): void;
    /**
     * Increments the value of the thumb by the step or page amount.
     */
    incrementThumb(index: number, stepSize?: number): void;
    /**
     * Decrements the value of the thumb by the step or page amount.
     */
    decrementThumb(index: number, stepSize?: number): void;
    /**
     * The step amount for the slider.
     */
    readonly step: number;
    /**
     * The page size for the slider, used to do a bigger step.
     */
    readonly pageSize: number;
    /** The orientation of the slider. */
    readonly orientation: Orientation;
    /** Whether the slider is disabled. */
    readonly isDisabled: boolean;
}
export interface SliderStateOptions<T> extends SliderProps<T> {
    numberFormatter: Intl.NumberFormat;
}
/**
 * Provides state management for a slider component. Stores values for all thumbs,
 * formats values for localization, and provides methods to update the position
 * of any thumbs.
 *
 * @param props
 */
export declare function useSliderState<T extends number | number[]>(props: SliderStateOptions<T>): SliderState;
