import { FocusableElement } from '@react-types/shared';
import { PressProps } from './usePress';
import React, { JSX, ReactNode } from 'react';
interface PressResponderProps extends PressProps {
    children: ReactNode;
}
export declare const PressResponder: React.ForwardRefExoticComponent<PressResponderProps & React.RefAttributes<FocusableElement>>;
export declare function ClearPressResponder({ children }: {
    children: ReactNode;
}): JSX.Element;
export {};
