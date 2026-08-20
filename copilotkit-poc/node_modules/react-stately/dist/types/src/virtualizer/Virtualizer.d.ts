import { ReusableView } from './ReusableView';
import { Collection, Key } from '@react-types/shared';
import { InvalidationContext, VirtualizerDelegate, VirtualizerRenderOptions } from './types';
import { Layout } from './Layout';
import { LayoutInfo } from './LayoutInfo';
import { Point } from './Point';
import { Rect } from './Rect';
import { Size } from './Size';
interface VirtualizerOptions<T extends object, V> {
    delegate: VirtualizerDelegate<T, V>;
    collection: Collection<T>;
    layout: Layout<T>;
}
/**
 * The Virtualizer class renders a scrollable collection of data using customizable layouts.
 * It supports very large collections by only rendering visible views to the DOM, reusing
 * them as you scroll. Virtualizer can present any type of view, including non-item views
 * such as section headers and footers.
 *
 * Virtualizer uses `Layout` objects to compute what views should be visible, and how
 * to position and style them. This means that virtualizer can have its items arranged in
 * a stack, a grid, a circle, or any other layout you can think of. The layout can be changed
 * dynamically at runtime as well.
 *
 * Layouts produce information on what views should appear in the virtualizer, but do not create the
 * views themselves directly. It is the responsibility of the `VirtualizerDelegate` object to render
 * elements for each layout info. The virtualizer manages a set of `ReusableView` objects, which are
 * reused as the user scrolls by swapping their content with cached elements returned by the
 * delegate.
 */
export declare class Virtualizer<T extends object, V> {
    /**
     * The virtualizer delegate. The delegate is used by the virtualizer
     * to create and configure views.
     */
    delegate: VirtualizerDelegate<T, V>;
    /** The current content of the virtualizer. */
    readonly collection: Collection<T>;
    /** The layout object that determines the visible views. */
    readonly layout: Layout<T>;
    /** The size of the scrollable content. */
    readonly contentSize: Size;
    /** The currently visible rectangle. */
    readonly visibleRect: Rect;
    /** The size of the virtualizer scroll view. */
    readonly size: Size;
    /** The set of persisted keys that are always present in the DOM, even if not currently in view. */
    readonly persistedKeys: Set<Key>;
    private _visibleViews;
    private _renderedContent;
    private _rootView;
    private _isScrolling;
    private _invalidationContext;
    private _overscanManager;
    constructor(options: VirtualizerOptions<T, V>);
    /** Returns whether the given key, or an ancestor, is persisted. */
    isPersistedKey(key: Key): boolean;
    private getParentView;
    private getReusableView;
    private _renderView;
    private _renderContent;
    /**
     * Returns the key for the item view currently at the given point.
     */
    keyAtPoint(point: Point): Key | null;
    private relayout;
    getVisibleLayoutInfos(): Map<Key, LayoutInfo>;
    private updateSubviews;
    /** Performs layout and updates visible views as needed. */
    render(opts: VirtualizerRenderOptions<T>): ReusableView<T, V>[];
    getVisibleView(key: Key): ReusableView<T, V> | undefined;
    invalidate(context: InvalidationContext): void;
    updateItemSize(key: Key, size: Size): void;
}
export {};
