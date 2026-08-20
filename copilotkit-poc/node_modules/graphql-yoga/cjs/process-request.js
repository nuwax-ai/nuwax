"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processResult = processResult;
exports.processRequest = processRequest;
const graphql_1 = require("graphql");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
function processResult({ request, result, fetchAPI, onResultProcessHooks, serverContext, }) {
    let resultProcessor;
    const acceptableMediaTypes = [];
    let acceptedMediaType = '*/*';
    return (0, promise_helpers_1.handleMaybePromise)(() => (0, promise_helpers_1.iterateAsync)(onResultProcessHooks, onResultProcessHook => onResultProcessHook({
        request,
        acceptableMediaTypes,
        result,
        setResult(newResult) {
            result = newResult;
        },
        resultProcessor,
        setResultProcessor(newResultProcessor, newAcceptedMimeType) {
            resultProcessor = newResultProcessor;
            acceptedMediaType = newAcceptedMimeType;
        },
        serverContext,
    })), () => {
        // If no result processor found for this result, return an error
        if (!resultProcessor) {
            return new fetchAPI.Response(null, {
                status: 406,
                statusText: 'Not Acceptable',
                headers: {
                    accept: acceptableMediaTypes.join('; charset=utf-8, '),
                },
            });
        }
        return resultProcessor(result, fetchAPI, acceptedMediaType);
    });
}
function processRequest({ params, enveloped, }) {
    // Parse GraphQLParams
    const document = enveloped.parse(params.query);
    // Validate parsed Document Node
    const errors = enveloped.validate(enveloped.schema, document);
    if (errors.length > 0) {
        return { errors };
    }
    // Build the context for the execution
    return (0, promise_helpers_1.handleMaybePromise)(() => enveloped.contextFactory(), contextValue => {
        const executionArgs = {
            schema: enveloped.schema,
            document,
            contextValue,
            variableValues: params.variables,
            operationName: params.operationName,
        };
        // Get the actual operation
        const operation = (0, graphql_1.getOperationAST)(document, params.operationName);
        // Choose the right executor
        const executeFn = operation?.operation === 'subscription' ? enveloped.subscribe : enveloped.execute;
        // Get the result to be processed
        return executeFn(executionArgs);
    });
}
