import { Observer, Subscription } from './types.js';
export declare class Store<T> {
    private atom;
    constructor(getValue: (prev?: NoInfer<T>) => T);
    constructor(initialValue: T);
    setState(updater: (prev: T) => T): void;
    get state(): T;
    get(): T;
    subscribe(observerOrFn: Observer<T> | ((value: T) => void)): Subscription;
}
export declare class ReadonlyStore<T> implements Omit<Store<T>, 'setState'> {
    private atom;
    constructor(getValue: (prev?: NoInfer<T>) => T);
    constructor(initialValue: T);
    get state(): T;
    get(): T;
    subscribe(observerOrFn: Observer<T> | ((value: T) => void)): Subscription;
}
export declare function createStore<T>(getValue: (prev?: NoInfer<T>) => T): ReadonlyStore<T>;
export declare function createStore<T>(initialValue: T): Store<T>;
