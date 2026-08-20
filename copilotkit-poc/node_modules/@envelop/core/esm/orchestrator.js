import { chain } from '@envelop/instrumentation';
import { handleMaybePromise, iterateAsync, iterateAsyncVoid } from '@whatwg-node/promise-helpers';
import { documentStringMap } from './document-string-map.js';
import { errorAsyncIterator, finalAsyncIterator, isAsyncIterable, makeExecute, makeSubscribe, mapAsyncIterator, } from './utils.js';
function throwEngineFunctionError(name) {
    throw Error(`No \`${name}\` function found! Register it using "useEngine" plugin.`);
}
export function createEnvelopOrchestrator({ plugins, }) {
    let schema = null;
    let initDone = false;
    const parse = () => throwEngineFunctionError('parse');
    const validate = () => throwEngineFunctionError('validate');
    const execute = () => throwEngineFunctionError('execute');
    const subscribe = () => throwEngineFunctionError('subscribe');
    let instrumentation;
    // Define the initial method for replacing the GraphQL schema, this is needed in order
    // to allow setting the schema from the onPluginInit callback. We also need to make sure
    // here not to call the same plugin that initiated the schema switch.
    const replaceSchema = (newSchema, ignorePluginIndex = -1) => {
        if (schema === newSchema) {
            return;
        }
        schema = newSchema;
        if (initDone) {
            for (const [i, plugin] of plugins.entries()) {
                if (i !== ignorePluginIndex) {
                    plugin.onSchemaChange &&
                        plugin.onSchemaChange({
                            schema,
                            replaceSchema: schemaToSet => {
                                replaceSchema(schemaToSet, i);
                            },
                        });
                }
            }
        }
    };
    const contextErrorHandlers = [];
    // Iterate all plugins and trigger onPluginInit
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        const pluginsToAdd = [];
        plugin.onPluginInit?.({
            plugins,
            addPlugin: newPlugin => {
                pluginsToAdd.push(newPlugin);
            },
            setSchema: modifiedSchema => replaceSchema(modifiedSchema, i),
            registerContextErrorHandler: handler => contextErrorHandlers.push(handler),
        });
        pluginsToAdd.length && plugins.splice(i + 1, 0, ...pluginsToAdd);
    }
    // A set of before callbacks defined here in order to allow it to be used later
    const beforeCallbacks = {
        init: [],
        parse: [],
        validate: [],
        subscribe: [],
        execute: [],
        context: [],
    };
    for (const { onContextBuilding, onExecute, onParse, onSubscribe, onValidate, onEnveloped, instrumentation: pluginInstrumentation, } of plugins) {
        onEnveloped && beforeCallbacks.init.push(onEnveloped);
        onContextBuilding && beforeCallbacks.context.push(onContextBuilding);
        onExecute && beforeCallbacks.execute.push(onExecute);
        onParse && beforeCallbacks.parse.push(onParse);
        onSubscribe && beforeCallbacks.subscribe.push(onSubscribe);
        onValidate && beforeCallbacks.validate.push(onValidate);
        if (pluginInstrumentation) {
            instrumentation = instrumentation
                ? chain(instrumentation, pluginInstrumentation)
                : pluginInstrumentation;
        }
    }
    const init = initialContext => {
        for (const [i, onEnveloped] of beforeCallbacks.init.entries()) {
            onEnveloped({
                context: initialContext,
                extendContext: extension => {
                    if (!initialContext) {
                        return;
                    }
                    Object.assign(initialContext, extension);
                },
                setSchema: modifiedSchema => replaceSchema(modifiedSchema, i),
            });
        }
    };
    const customParse = beforeCallbacks.parse.length
        ? initialContext => (source, parseOptions) => {
            let result = null;
            let parseFn = parse;
            const context = initialContext;
            const afterCalls = [];
            for (const onParse of beforeCallbacks.parse) {
                const afterFn = onParse({
                    context,
                    extendContext: extension => {
                        Object.assign(context, extension);
                    },
                    params: { source, options: parseOptions },
                    parseFn,
                    setParseFn: newFn => {
                        parseFn = newFn;
                    },
                    setParsedDocument: newDoc => {
                        result = newDoc;
                    },
                });
                if (afterFn) {
                    afterCalls.push(afterFn);
                }
            }
            if (result === null) {
                try {
                    result = parseFn(source, parseOptions);
                }
                catch (e) {
                    result = e;
                }
            }
            for (const afterCb of afterCalls) {
                afterCb({
                    context,
                    extendContext: extension => {
                        Object.assign(context, extension);
                    },
                    replaceParseResult: newResult => {
                        result = newResult;
                    },
                    result,
                });
            }
            if (result === null) {
                throw new Error(`Failed to parse document.`);
            }
            if (result instanceof Error) {
                throw result;
            }
            documentStringMap.set(result, source.toString());
            return result;
        }
        : () => parse;
    const customValidate = beforeCallbacks.validate
        .length
        ? initialContext => (schema, documentAST, rules, typeInfo, validationOptions) => {
            let actualRules = rules ? [...rules] : undefined;
            let validateFn = validate;
            let result = null;
            const context = initialContext;
            const afterCalls = [];
            for (const onValidate of beforeCallbacks.validate) {
                const afterFn = onValidate({
                    context,
                    extendContext: extension => {
                        Object.assign(context, extension);
                    },
                    params: {
                        schema,
                        documentAST,
                        rules: actualRules,
                        typeInfo,
                        options: validationOptions,
                    },
                    validateFn,
                    addValidationRule: rule => {
                        if (!actualRules) {
                            actualRules = [];
                        }
                        actualRules.push(rule);
                    },
                    setValidationFn: newFn => {
                        validateFn = newFn;
                    },
                    setResult: newResults => {
                        result = newResults;
                    },
                });
                afterFn && afterCalls.push(afterFn);
            }
            if (!result) {
                result = validateFn(schema, documentAST, actualRules, typeInfo, validationOptions);
            }
            if (!result) {
                return;
            }
            const valid = result.length === 0;
            for (const afterCb of afterCalls) {
                afterCb({
                    valid,
                    result,
                    context,
                    extendContext: extension => {
                        Object.assign(context, extension);
                    },
                    setResult: newResult => {
                        result = newResult;
                    },
                });
            }
            return result;
        }
        : () => validate;
    const customContextFactory = beforeCallbacks.context.length
        ? initialContext => orchestratorCtx => {
            const afterCalls = [];
            // In order to have access to the "last working" context object we keep this outside of the try block:
            const context = initialContext;
            if (orchestratorCtx) {
                Object.assign(context, orchestratorCtx);
            }
            let isBreakingContextBuilding = false;
            return handleMaybePromise(() => iterateAsync(beforeCallbacks.context, (onContext, stopEarly) => onContext({
                context,
                extendContext: extension => {
                    Object.assign(context, extension);
                },
                breakContextBuilding: () => {
                    isBreakingContextBuilding = true;
                    stopEarly();
                },
            }), afterCalls), () => {
                if (!isBreakingContextBuilding) {
                    return handleMaybePromise(() => iterateAsync(afterCalls, afterCb => afterCb({
                        context,
                        extendContext(extension) {
                            Object.assign(context, extension);
                        },
                    })), () => context);
                }
                return context;
            }, err => {
                let error = err;
                for (const errorCb of contextErrorHandlers) {
                    errorCb({
                        context,
                        error,
                        setError: err => {
                            error = err;
                        },
                    });
                }
                throw error;
            });
        }
        : initialContext => orchestratorCtx => {
            if (orchestratorCtx) {
                Object.assign(initialContext, orchestratorCtx);
            }
            return initialContext;
        };
    const useCustomSubscribe = beforeCallbacks.subscribe.length;
    const customSubscribe = useCustomSubscribe
        ? makeSubscribe(args => {
            let subscribeFn = subscribe;
            const afterCallbacks = [];
            const context = args.contextValue || {};
            let result;
            return handleMaybePromise(() => iterateAsync(beforeCallbacks.subscribe, (onSubscribe, endEarly) => onSubscribe({
                subscribeFn,
                setSubscribeFn: newSubscribeFn => {
                    subscribeFn = newSubscribeFn;
                },
                context,
                extendContext: extension => {
                    Object.assign(context, extension);
                },
                args: args,
                setResultAndStopExecution: stopResult => {
                    result = stopResult;
                    endEarly();
                },
            }), afterCallbacks), () => {
                const afterCalls = [];
                const subscribeErrorHandlers = [];
                for (const { onSubscribeResult, onSubscribeError } of afterCallbacks) {
                    if (onSubscribeResult) {
                        afterCalls.push(onSubscribeResult);
                    }
                    if (onSubscribeError) {
                        subscribeErrorHandlers.push(onSubscribeError);
                    }
                }
                return handleMaybePromise(() => result || subscribeFn(args), result => {
                    const onNextHandler = [];
                    const onEndHandler = [];
                    for (const afterCb of afterCalls) {
                        const hookResult = afterCb({
                            args: args,
                            result,
                            setResult: newResult => {
                                result = newResult;
                            },
                        });
                        if (hookResult) {
                            if (hookResult.onNext) {
                                onNextHandler.push(hookResult.onNext);
                            }
                            if (hookResult.onEnd) {
                                onEndHandler.push(hookResult.onEnd);
                            }
                        }
                    }
                    if (onNextHandler.length && isAsyncIterable(result)) {
                        result = mapAsyncIterator(result, (result) => handleMaybePromise(() => iterateAsync(onNextHandler, onNext => onNext({
                            args: args,
                            result,
                            setResult: newResult => (result = newResult),
                        })), () => result));
                    }
                    if (onEndHandler.length && isAsyncIterable(result)) {
                        result = finalAsyncIterator(result, () => {
                            for (const onEnd of onEndHandler) {
                                onEnd();
                            }
                        });
                    }
                    if (subscribeErrorHandlers.length && isAsyncIterable(result)) {
                        result = errorAsyncIterator(result, err => {
                            let error = err;
                            for (const handler of subscribeErrorHandlers) {
                                handler({
                                    error,
                                    setError: err => {
                                        error = err;
                                    },
                                });
                            }
                            throw error;
                        });
                    }
                    return result;
                });
            });
        })
        : makeSubscribe(subscribe);
    const useCustomExecute = beforeCallbacks.execute.length;
    const customExecute = useCustomExecute
        ? makeExecute(args => {
            let executeFn = execute;
            let result;
            const afterCalls = [];
            const afterDoneCalls = [];
            const context = args.contextValue || {};
            return handleMaybePromise(() => iterateAsync(beforeCallbacks.execute, (onExecute, endEarly) => onExecute({
                executeFn,
                setExecuteFn: newExecuteFn => {
                    executeFn = newExecuteFn;
                },
                setResultAndStopExecution: stopResult => {
                    result = stopResult;
                    endEarly();
                },
                context,
                extendContext: extension => {
                    if (typeof extension === 'object') {
                        Object.assign(context, extension);
                    }
                    else {
                        throw new Error(`Invalid context extension provided! Expected "object", got: "${JSON.stringify(extension)}" (${typeof extension})`);
                    }
                },
                args: args,
            }), afterCalls), () => handleMaybePromise(() => result ||
                executeFn({
                    ...args,
                    contextValue: context,
                }), result => handleMaybePromise(() => iterateAsync(afterCalls, afterCb => afterCb.onExecuteDone?.({
                args: args,
                result,
                setResult: newResult => {
                    result = newResult;
                },
            }), afterDoneCalls), () => {
                const onNextHandler = [];
                const onEndHandler = [];
                for (const { onNext, onEnd } of afterDoneCalls) {
                    if (onNext) {
                        onNextHandler.push(onNext);
                    }
                    if (onEnd) {
                        onEndHandler.push(onEnd);
                    }
                }
                if (onNextHandler.length && isAsyncIterable(result)) {
                    result = mapAsyncIterator(result, result => handleMaybePromise(() => iterateAsyncVoid(onNextHandler, onNext => onNext({
                        args: args,
                        result: result,
                        setResult: newResult => {
                            result = newResult;
                        },
                    })), () => result));
                }
                if (onEndHandler.length && isAsyncIterable(result)) {
                    result = finalAsyncIterator(result, () => {
                        for (const onEnd of onEndHandler) {
                            onEnd();
                        }
                    });
                }
                return result;
            })));
        })
        : makeExecute(execute);
    initDone = true;
    // This is done in order to trigger the first schema available, to allow plugins that needs the schema
    // eagerly to have it.
    if (schema) {
        for (const [i, plugin] of plugins.entries()) {
            plugin.onSchemaChange?.({
                schema,
                replaceSchema: modifiedSchema => replaceSchema(modifiedSchema, i),
            });
        }
    }
    return {
        getCurrentSchema() {
            return schema;
        },
        init,
        parse: customParse,
        validate: customValidate,
        execute: customExecute,
        subscribe: customSubscribe,
        contextFactory: customContextFactory,
        instrumentation,
    };
}
