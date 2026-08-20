import { Collection, Key } from '@react-types/shared';
import { Layout } from './Layout';
import React from 'react';
import { Rect } from './Rect';
import { ReusableView } from './ReusableView';
import { Size } from './Size';
import { Virtualizer } from './Virtualizer';
export declare const useLayoutEffect: typeof React.useLayoutEffect;
interface VirtualizerProps<T extends object, V, O> {
    renderView(type: string, content: T | null): V;
    layout: Layout<T>;
    collection: Collection<T>;
    onVisibleRectChange(rect: Rect): void;
    persistedKeys?: Set<Key> | null;
    layoutOptions?: O;
    allowsWindowScrolling?: boolean;
}
export interface VirtualizerState<T extends object, V> {
    visibleViews: ReusableView<T, V>[];
    setVisibleRect: (rect: Rect) => void;
    size: Size;
    setSize: (size: Size) => void;
    contentSize: Size;
    virtualizer: Virtualizer<T, V>;
    isScrolling: boolean;
    startScrolling: () => void;
    endScrolling: () => void;
}
export declare function useVirtualizerState<T extends object, V, O = any>(opts: VirtualizerProps<T, V, O>): VirtualizerState<T, V>;
export {};
