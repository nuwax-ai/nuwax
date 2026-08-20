export declare function isPromiseLike(value: any): value is PromiseLike<unknown>;
export declare function isIteratorLike(value: any): value is Iterator<unknown> | AsyncIterator<unknown>;
export declare function safeRace<T>(contenders: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>;
