/** An error subclass which is thrown when there are too many pending push or next operations on a single repeater. */
export declare class RepeaterOverflowError extends Error {
    constructor(message: string);
}
/*** BUFFERS ***/
/** A special queue interface which allow multiple values to be pushed onto a repeater without having pushes wait or throw overflow errors, passed as the second argument to the repeater constructor. */
export interface RepeaterBuffer<TValue = unknown> {
    empty: boolean;
    full: boolean;
    add(value: TValue): unknown;
    remove(): TValue;
}
/** A buffer which allows you to push a set amount of values to the repeater without pushes waiting or throwing errors. */
export declare class FixedBuffer implements RepeaterBuffer {
    _c: number;
    _q: Array<unknown>;
    constructor(capacity: number);
    get empty(): boolean;
    get full(): boolean;
    add(value: unknown): void;
    remove(): unknown;
}
/** Sliding buffers allow you to push a set amount of values to the repeater without pushes waiting or throwing errors. If the number of values exceeds the capacity set in the constructor, the buffer will discard the earliest values added. */
export declare class SlidingBuffer implements RepeaterBuffer {
    _c: number;
    _q: Array<unknown>;
    constructor(capacity: number);
    get empty(): boolean;
    get full(): boolean;
    add(value: unknown): void;
    remove(): unknown;
}
/** Dropping buffers allow you to push a set amount of values to the repeater without the push function waiting or throwing errors. If the number of values exceeds the capacity set in the constructor, the buffer will discard the latest values added. */
export declare class DroppingBuffer implements RepeaterBuffer {
    _c: number;
    _q: Array<unknown>;
    constructor(capacity: number);
    get empty(): boolean;
    get full(): boolean;
    add(value: unknown): void;
    remove(): unknown;
}
/*** TYPES ***/
/** The type of the first argument passed to the executor callback. */
export type Push<T, TNext = unknown> = (value: PromiseLike<T> | T) => Promise<TNext | undefined>;
/** The type of the second argument passed to the executor callback. A callable promise. */
export type Stop = ((err?: unknown) => undefined) & Promise<undefined>;
/** The type of the callback passed to the Repeater constructor. */
export type RepeaterExecutor<T, TReturn = any, TNext = unknown> = (push: Push<T, TNext>, stop: Stop) => PromiseLike<TReturn> | TReturn;
/** The maximum number of push or next operations which may exist on a single repeater. */
export declare const MAX_QUEUE_LENGTH = 1024;
export declare class Repeater<T, TReturn = any, TNext = unknown> {
    [Symbol.asyncDispose]: () => Promise<IteratorResult<T, TReturn>>;
    [Symbol.dispose]: () => void;
    constructor(executor: RepeaterExecutor<T, TReturn, TNext>, buffer?: RepeaterBuffer | undefined);
    next(value?: PromiseLike<TNext> | TNext): Promise<IteratorResult<T, TReturn>>;
    return(value?: PromiseLike<TReturn> | TReturn): Promise<IteratorResult<T, TReturn>>;
    throw(err: unknown): Promise<IteratorResult<T, TReturn>>;
    [Symbol.asyncIterator](): this;
}
export interface Repeater<T, TReturn = any, TNext = unknown> {
}
