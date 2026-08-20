import { DOMAttributes, FocusableElement } from '@react-types/shared';
import { PressProps } from './usePress';
import React, { ReactElement } from 'react';
export interface PressableProps extends PressProps {
    children: ReactElement<DOMAttributes, string>;
}
export declare const Pressable: React.ForwardRefExoticComponent<PressableProps & React.RefAttributes<FocusableElement>>;
