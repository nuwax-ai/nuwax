import { Atom, AtomOptions, Observer, ReadonlyAtom } from './types.js';
export declare function toObserver<T>(nextHandler?: Observer<T> | ((value: T) => void), errorHandler?: (error: any) => void, completionHandler?: () => void): Observer<T>;
export declare function batch(fn: () => void): void;
export declare function flush(): void;
type AsyncAtomState<TData, TError = unknown> = {
    status: 'pending';
} | {
    status: 'done';
    data: TData;
} | {
    status: 'error';
    error: TError;
};
export declare function createAsyncAtom<T>(getValue: () => Promise<T>, options?: AtomOptions<AsyncAtomState<T>>): ReadonlyAtom<AsyncAtomState<T>>;
export declare function createAtom<T>(getValue: (prev?: NoInfer<T>) => T, options?: AtomOptions<T>): ReadonlyAtom<T>;
export declare function createAtom<T>(initialValue: T, options?: AtomOptions<T>): Atom<T>;
export {};
