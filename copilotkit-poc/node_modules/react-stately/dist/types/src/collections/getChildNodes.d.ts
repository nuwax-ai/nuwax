import type { Collection, Node } from '@react-types/shared';
export declare function getChildNodes<T>(node: Node<T>, collection: Collection<Node<T>>): Iterable<Node<T>>;
export declare function getFirstItem<T>(iterable: Iterable<T>): T | undefined;
export declare function getNthItem<T>(iterable: Iterable<T>, index: number): T | undefined;
export declare function getLastItem<T>(iterable: Iterable<T>): T | undefined;
export declare function compareNodeOrder<T>(collection: Collection<Node<T>>, a: Node<T>, b: Node<T>): number;
