import { CollectionBase, Node } from '@react-types/shared';
export declare class CollectionBuilder<T extends object> {
    private context?;
    private cache;
    build(props: Partial<CollectionBase<T>>, context?: unknown): Iterable<Node<T>>;
    private iterateCollection;
    private getKey;
    private getChildState;
    private getFullNode;
}
