interface Props {
    [key: string]: any;
}
type PropsArg = Props | null | undefined;
type TupleTypes<T> = {
    [P in keyof T]: T[P];
} extends {
    [key: number]: infer V;
} ? NullToObject<V> : never;
type NullToObject<T> = T extends null | undefined ? {} : T;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
/**
 * Merges multiple props objects together. Event handlers are chained,
 * classNames are combined, ids are deduplicated, and refs are merged.
 * For all other props, the last prop object overrides all previous ones.
 *
 * @param args - Multiple sets of props to merge together.
 */
export declare function mergeProps<T extends PropsArg[]>(...args: T): UnionToIntersection<TupleTypes<T>>;
export {};
