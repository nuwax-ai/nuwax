"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPromise = exports.mapMaybePromise = exports.makeExecute = exports.mapAsyncIterator = exports.makeSubscribe = exports.envelopIsIntrospectionSymbol = void 0;
exports.isIntrospectionOperationString = isIntrospectionOperationString;
exports.isAsyncIterable = isAsyncIterable;
exports.handleStreamOrSingleExecutionResult = handleStreamOrSingleExecutionResult;
exports.finalAsyncIterator = finalAsyncIterator;
exports.errorAsyncIterator = errorAsyncIterator;
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
exports.envelopIsIntrospectionSymbol = Symbol('ENVELOP_IS_INTROSPECTION');
function isIntrospectionOperationString(operation) {
    return (typeof operation === 'string' ? operation : operation.body).indexOf('__schema') !== -1;
}
function getSubscribeArgs(args) {
    return args.length === 1
        ? args[0]
        : {
            schema: args[0],
            document: args[1],
            rootValue: args[2],
            contextValue: args[3],
            variableValues: args[4],
            operationName: args[5],
            fieldResolver: args[6],
            subscribeFieldResolver: args[7],
        };
}
/**
 * Utility function for making a subscribe function that handles polymorphic arguments.
 */
const makeSubscribe = (subscribeFn) => ((...polyArgs) => subscribeFn(getSubscribeArgs(polyArgs)));
exports.makeSubscribe = makeSubscribe;
var promise_helpers_2 = require("@whatwg-node/promise-helpers");
Object.defineProperty(exports, "mapAsyncIterator", { enumerable: true, get: function () { return promise_helpers_2.mapAsyncIterator; } });
function getExecuteArgs(args) {
    return args.length === 1
        ? args[0]
        : {
            schema: args[0],
            document: args[1],
            rootValue: args[2],
            contextValue: args[3],
            variableValues: args[4],
            operationName: args[5],
            fieldResolver: args[6],
            typeResolver: args[7],
        };
}
/**
 * Utility function for making a execute function that handles polymorphic arguments.
 */
const makeExecute = (executeFn) => ((...polyArgs) => executeFn(getExecuteArgs(polyArgs)));
exports.makeExecute = makeExecute;
/**
 * Returns true if the provided object implements the AsyncIterator protocol via
 * implementing a `Symbol.asyncIterator` method.
 *
 * Source: https://github.com/graphql/graphql-js/blob/main/src/jsutils/isAsyncIterable.ts
 */
function isAsyncIterable(maybeAsyncIterable) {
    return (typeof maybeAsyncIterable === 'object' &&
        maybeAsyncIterable != null &&
        typeof maybeAsyncIterable[Symbol.asyncIterator] === 'function');
}
/**
 * A utility function for handling `onExecuteDone` hook result, for simplifying the handling of AsyncIterable returned from `execute`.
 *
 * @param payload The payload send to `onExecuteDone` hook function
 * @param fn The handler to be executed on each result
 * @returns a subscription for streamed results, or undefined in case of an non-async
 */
function handleStreamOrSingleExecutionResult(payload, fn) {
    if (isAsyncIterable(payload.result)) {
        return { onNext: fn };
    }
    fn({
        args: payload.args,
        result: payload.result,
        setResult: payload.setResult,
    });
    return undefined;
}
function finalAsyncIterator(source, onFinal) {
    let iterator;
    function ensureIterator() {
        if (!iterator) {
            iterator = source[Symbol.asyncIterator]();
        }
        return iterator;
    }
    let isDone = false;
    return {
        [Symbol.asyncIterator]() {
            return this;
        },
        next() {
            return ensureIterator()
                .next()
                .then(result => {
                if (result.done && isDone === false) {
                    isDone = true;
                    onFinal();
                }
                return result;
            });
        },
        return() {
            const promise = ensureIterator().return?.();
            if (isDone === false) {
                isDone = true;
                onFinal();
            }
            return promise || (0, promise_helpers_1.fakePromise)({ done: true, value: undefined });
        },
        throw(error) {
            const promise = ensureIterator().throw?.();
            if (promise) {
                return promise;
            }
            // if the source has no throw method we just re-throw error
            // usually throw is not called anyways
            throw error;
        },
        [Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose')]() {
            // This is a no-op, but we need to implement it to ensure that the AsyncGenerator
            // is properly cleaned up when the subscription is disposed.
            return (0, promise_helpers_1.fakePromise)();
        },
    };
}
function errorAsyncIterator(source, onError) {
    let iterator;
    function ensureIterator() {
        if (!iterator) {
            iterator = source[Symbol.asyncIterator]();
        }
        return iterator;
    }
    return {
        [Symbol.asyncIterator]() {
            return this;
        },
        next() {
            return ensureIterator()
                .next()
                .catch(error => {
                onError(error);
                return { done: true, value: undefined };
            });
        },
        return() {
            const promise = ensureIterator().return?.();
            return promise || (0, promise_helpers_1.fakePromise)({ done: true, value: undefined });
        },
        throw(error) {
            const promise = ensureIterator().throw?.();
            if (promise) {
                return promise;
            }
            // if the source has no throw method we just re-throw error
            // usually throw is not called anyways
            throw error;
        },
        [Symbol.asyncDispose || Symbol.for('Symbol.asyncDispose')]() {
            // This is a no-op, but we need to implement it to ensure that the AsyncGenerator
            // is properly cleaned up when the subscription is disposed.
            return (0, promise_helpers_1.fakePromise)();
        },
    };
}
var promise_helpers_3 = require("@whatwg-node/promise-helpers");
Object.defineProperty(exports, "mapMaybePromise", { enumerable: true, get: function () { return promise_helpers_3.mapMaybePromise; } });
Object.defineProperty(exports, "isPromise", { enumerable: true, get: function () { return promise_helpers_3.isPromise; } });
