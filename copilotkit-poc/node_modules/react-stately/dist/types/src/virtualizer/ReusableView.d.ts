import { Key } from '@react-types/shared';
import { LayoutInfo } from './LayoutInfo';
import { Virtualizer } from './Virtualizer';
/**
 * `Virtualizer` creates instances of the `ReusableView` class to
 * represent views currently being displayed.
 */
export declare class ReusableView<T extends object, V> {
    /** The Virtualizer this view is a part of. */
    virtualizer: Virtualizer<T, V>;
    /** The LayoutInfo this view is currently representing. */
    layoutInfo: LayoutInfo | null;
    /** The content currently being displayed by this view, set by the virtualizer. */
    content: T | null;
    rendered: V | null;
    viewType: string;
    key: Key;
    children: Set<ChildView<T, V>>;
    reusableViews: Map<string, ChildView<T, V>[]>;
    constructor(virtualizer: Virtualizer<T, V>, viewType: string);
    /**
     * Prepares the view for reuse. Called just before the view is removed from the DOM.
     */
    prepareForReuse(): void;
    getReusableView(reuseType: string): ChildView<T, V>;
    reuseChild(child: ChildView<T, V>): void;
}
export declare class RootView<T extends object, V> extends ReusableView<T, V> {
    constructor(virtualizer: Virtualizer<T, V>);
}
export declare class ChildView<T extends object, V> extends ReusableView<T, V> {
    parent: ReusableView<T, V>;
    constructor(virtualizer: Virtualizer<T, V>, parent: ReusableView<T, V>, viewType: string);
}
