import { Collection, CollectionStateBase, Node } from '@react-types/shared';
import { ReactElement } from 'react';
interface CollectionOptions<T, C extends Collection<Node<T>>> extends Omit<CollectionStateBase<T, C>, 'children'> {
    children?: ReactElement<any> | null | (ReactElement<any> | null)[] | ((item: T) => ReactElement<any> | null);
}
type CollectionFactory<T, C extends Collection<Node<T>>> = (node: Iterable<Node<T>>) => C;
export declare function useCollection<T, C extends Collection<Node<T>> = Collection<Node<T>>>(props: CollectionOptions<T, C>, factory: CollectionFactory<T, C>, context?: unknown): C;
export {};
