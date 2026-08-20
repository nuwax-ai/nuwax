import { ColorChannel } from 'react-stately/Color';
import { ColorAreaState } from 'react-stately/useColorAreaState';
import { CSSProperties } from 'react';
interface Gradients {
    colorAreaStyleProps: {
        style: CSSProperties;
    };
    thumbStyleProps: {
        style: CSSProperties;
    };
}
interface ColorAreaGradientProps {
    direction: 'ltr' | 'rtl';
    state: ColorAreaState;
    zChannel: ColorChannel;
    xChannel: ColorChannel;
    yChannel: ColorChannel;
}
export declare function useColorAreaGradient({ direction, state, zChannel, xChannel, yChannel }: ColorAreaGradientProps): Gradients;
export {};
