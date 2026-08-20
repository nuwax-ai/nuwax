import { SliderState } from 'react-stately/useSliderState';
interface SliderData {
    id: string;
    'aria-describedby'?: string;
    'aria-details'?: string;
}
export declare const sliderData: WeakMap<SliderState, SliderData>;
export declare function getSliderThumbId(state: SliderState, index: number): string;
export {};
