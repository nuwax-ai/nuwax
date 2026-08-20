import { Rect, Size } from 'react-stately/useVirtualizerState';
import React, { CSSProperties, HTMLAttributes, ReactNode, RefObject } from 'react';
interface ScrollViewProps extends Omit<HTMLAttributes<HTMLElement>, 'onScroll'> {
    contentSize: Size;
    onVisibleRectChange: (rect: Rect) => void;
    onSizeChange?: (size: Size) => void;
    children?: ReactNode;
    innerStyle?: CSSProperties;
    onScrollStart?: () => void;
    onScrollEnd?: () => void;
    scrollDirection?: 'horizontal' | 'vertical' | 'both';
    onScroll?: (e: Event) => void;
    allowsWindowScrolling?: boolean;
}
declare const ScrollViewForwardRef: React.ForwardRefExoticComponent<ScrollViewProps & React.RefAttributes<HTMLDivElement | null>>;
export { ScrollViewForwardRef as ScrollView };
interface ScrollViewAria {
    isScrolling: boolean;
    scrollViewProps: HTMLAttributes<HTMLElement>;
    contentProps: HTMLAttributes<HTMLElement>;
}
export declare function useScrollView(props: ScrollViewProps, ref: RefObject<HTMLElement | null>): ScrollViewAria;
