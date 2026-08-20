import { AsyncIterableIteratorOrValue, DefaultContext, ExecuteFunction, ExecutionArgs, OnExecuteDoneEventPayload, OnExecuteDoneHookResult, OnExecuteDoneHookResultOnNextHook, PromiseOrValue, SubscribeFunction } from '@envelop/types';
export declare const envelopIsIntrospectionSymbol: unique symbol;
export declare function isIntrospectionOperationString(operation: string | any): boolean;
/**
 * Utility function for making a subscribe function that handles polymorphic arguments.
 */
export declare const makeSubscribe: (subscribeFn: (args: ExecutionArgs) => any) => SubscribeFunction;
export { mapAsyncIterator } from '@whatwg-node/promise-helpers';
/**
 * Utility function for making a execute function that handles polymorphic arguments.
 */
export declare const makeExecute: (executeFn: (args: ExecutionArgs) => PromiseOrValue<AsyncIterableIteratorOrValue<any>>) => ExecuteFunction;
/**
 * Returns true if the provided object implements the AsyncIterator protocol via
 * implementing a `Symbol.asyncIterator` method.
 *
 * Source: https://github.com/graphql/graphql-js/blob/main/src/jsutils/isAsyncIterable.ts
 */
export declare function isAsyncIterable<TType>(maybeAsyncIterable: any): maybeAsyncIterable is AsyncIterable<TType>;
/**
 * A utility function for handling `onExecuteDone` hook result, for simplifying the handling of AsyncIterable returned from `execute`.
 *
 * @param payload The payload send to `onExecuteDone` hook function
 * @param fn The handler to be executed on each result
 * @returns a subscription for streamed results, or undefined in case of an non-async
 */
export declare function handleStreamOrSingleExecutionResult<ContextType = DefaultContext>(payload: OnExecuteDoneEventPayload<ContextType>, fn: OnExecuteDoneHookResultOnNextHook<ContextType>): void | OnExecuteDoneHookResult<ContextType>;
export declare function finalAsyncIterator<TInput>(source: AsyncIterable<TInput>, onFinal: () => void): AsyncGenerator<TInput>;
export declare function errorAsyncIterator<TInput>(source: AsyncIterable<TInput>, onError: (err: unknown) => void): AsyncGenerator<TInput>;
export { mapMaybePromise, isPromise } from '@whatwg-node/promise-helpers';
