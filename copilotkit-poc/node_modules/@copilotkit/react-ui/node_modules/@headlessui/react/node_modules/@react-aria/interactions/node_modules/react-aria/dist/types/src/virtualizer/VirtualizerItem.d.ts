import { Direction } from '@react-types/shared';
import { LayoutInfo } from 'react-stately/useVirtualizerState';
import { CSSProperties, JSX, ReactNode } from 'react';
import { VirtualizerItemOptions } from './useVirtualizerItem';
interface VirtualizerItemProps extends Omit<VirtualizerItemOptions, 'ref'> {
    layoutInfo: LayoutInfo;
    parent?: LayoutInfo | null;
    style?: CSSProperties;
    className?: string;
    children: ReactNode;
}
export declare function VirtualizerItem(props: VirtualizerItemProps): JSX.Element;
export declare function layoutInfoToStyle(layoutInfo: LayoutInfo, dir: Direction, parent?: LayoutInfo | null): CSSProperties;
export {};
