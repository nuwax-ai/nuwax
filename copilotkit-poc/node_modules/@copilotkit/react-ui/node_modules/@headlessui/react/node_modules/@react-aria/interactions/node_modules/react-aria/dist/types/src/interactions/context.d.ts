import { FocusableElement } from '@react-types/shared';
import { PressProps } from './usePress';
import React, { MutableRefObject } from 'react';
interface IPressResponderContext extends PressProps {
    register(): void;
    ref?: MutableRefObject<FocusableElement>;
}
export declare const PressResponderContext: React.Context<IPressResponderContext>;
export {};
