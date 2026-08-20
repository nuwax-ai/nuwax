import { Collection, Key, RefObject } from '@react-types/shared';
import { Layout, ReusableView } from 'react-stately/useVirtualizerState';
import React, { HTMLAttributes, ReactElement } from 'react';
type RenderWrapper<T extends object, V> = (parent: ReusableView<T, V> | null, reusableView: ReusableView<T, V>, children: ReusableView<T, V>[], renderChildren: (views: ReusableView<T, V>[]) => ReactElement[]) => ReactElement | null;
interface VirtualizerProps<T extends object, V, O> extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onScroll'> {
    children: (type: string, content: T) => V;
    renderWrapper?: RenderWrapper<T, V>;
    layout: Layout<T, O>;
    collection: Collection<T>;
    persistedKeys?: Set<Key> | null;
    scrollDirection?: 'horizontal' | 'vertical' | 'both';
    isLoading?: boolean;
    onLoadMore?: () => void;
    layoutOptions?: O;
    onScroll?: (e: Event) => void;
}
export declare const Virtualizer: <T extends object, V, O>(props: VirtualizerProps<T, V, O> & {
    ref?: RefObject<HTMLDivElement | null> | undefined;
}) => ReactElement<unknown, string | React.JSXElementConstructor<any>>;
export {};
