import { ReactNode } from 'react';
import { Key } from '@react-types/shared';
export interface CachedChildrenOptions<T> {
    /** Item objects in the collection. */
    items?: Iterable<T>;
    /** The contents of the collection. */
    children?: ReactNode | ((item: T) => ReactNode);
    /** Values that should invalidate the item cache when using dynamic collections. */
    dependencies?: ReadonlyArray<any>;
    /** A scope to prepend to all child item ids to ensure they are unique. */
    idScope?: Key;
    /** Whether to add `id` and `value` props to all child items. */
    addIdAndValue?: boolean;
}
/**
 * Maps over a list of items and renders React elements for them. Each rendered item is
 * cached based on object identity, and React keys are generated from the `key` or `id` property.
 */
export declare function useCachedChildren<T>(props: CachedChildrenOptions<T>): ReactNode;
