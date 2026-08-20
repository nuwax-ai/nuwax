import { Collection, Key } from '@react-types/shared';
import { Layout } from './Layout';
import { Rect } from './Rect';
import { Size } from './Size';
export interface InvalidationContext<O = any> {
    contentChanged?: boolean;
    offsetChanged?: boolean;
    sizeChanged?: boolean;
    itemSizeChanged?: boolean;
    layoutOptionsChanged?: boolean;
    layoutOptions?: O;
}
export interface VirtualizerDelegate<T extends object, V> {
    setVisibleRect(rect: Rect): void;
    renderView(type: string, content: T | null): V;
    invalidate(ctx: InvalidationContext): void;
}
export interface VirtualizerRenderOptions<T extends object, O = any> {
    layout: Layout<T>;
    collection: Collection<T>;
    persistedKeys?: Set<Key> | null;
    visibleRect: Rect;
    size: Size;
    invalidationContext: InvalidationContext;
    isScrolling: boolean;
    layoutOptions?: O;
}
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
