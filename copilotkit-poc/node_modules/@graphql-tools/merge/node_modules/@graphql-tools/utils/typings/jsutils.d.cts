import { isPromise, type MaybePromise } from '@whatwg-node/promise-helpers';
export declare function isIterableObject(value: unknown): value is Iterable<unknown>;
export declare function isObjectLike(value: unknown): value is {
    [key: string]: unknown;
};
export { isPromise };
export declare function promiseReduce<T, U>(values: Iterable<T>, callbackFn: (accumulator: U, currentValue: T) => MaybePromise<U>, initialValue: MaybePromise<U>): MaybePromise<U>;
export declare function hasOwnProperty(obj: unknown, prop: string): boolean;
