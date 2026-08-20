import { BaseCollection, CollectionNode } from './BaseCollection';
import { CachedChildrenOptions } from './useCachedChildren';
import { Key, Node } from '@react-types/shared';
import React, { ForwardedRef, JSX, ReactElement, ReactNode } from 'react';
export interface CollectionBuilderProps<C extends BaseCollection<any>> {
    content: ReactNode;
    children: (collection: C) => ReactNode;
    createCollection?: () => C;
}
/**
 * Builds a `Collection` from the children provided to the `content` prop, and passes it to the
 * child render prop function.
 */
export declare function CollectionBuilder<C extends BaseCollection<any>>(props: CollectionBuilderProps<C>): ReactElement;
export type CollectionNodeClass<T> = {
    new (key: Key): CollectionNode<T>;
    readonly type: string;
};
export declare function createLeafComponent<T, P extends object, E extends Element>(CollectionNodeClass: CollectionNodeClass<any> | string, render: (props: P, ref: ForwardedRef<E>) => ReactElement | null): (props: P & React.RefAttributes<E>) => ReactElement | null;
export declare function createLeafComponent<T, P extends object, E extends Element>(CollectionNodeClass: CollectionNodeClass<any> | string, render: (props: P, ref: ForwardedRef<E>, node: Node<T>) => ReactElement | null): (props: P & React.RefAttributes<E>) => ReactElement | null;
export declare function createBranchComponent<T, P extends {
    children?: any;
}, E extends Element>(CollectionNodeClass: CollectionNodeClass<any> | string, render: (props: P, ref: ForwardedRef<E>, node: Node<T>) => ReactElement | null, useChildren?: (props: P) => ReactNode): (props: P & React.RefAttributes<E>) => ReactElement | null;
export interface CollectionProps<T> extends CachedChildrenOptions<T> {
}
/** A Collection renders a list of items, automatically managing caching and keys. */
export declare function Collection<T>(props: CollectionProps<T>): JSX.Element;
