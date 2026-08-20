import { getOperationAST } from 'graphql';
import { handleMaybePromise, iterateAsync } from '@whatwg-node/promise-helpers';
export function processResult({ request, result, fetchAPI, onResultProcessHooks, serverContext, }) {
    let resultProcessor;
    const acceptableMediaTypes = [];
    let acceptedMediaType = '*/*';
    return handleMaybePromise(() => iterateAsync(onResultProcessHooks, onResultProcessHook => onResultProcessHook({
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
export function processRequest({ params, enveloped, }) {
    // Parse GraphQLParams
    const document = enveloped.parse(params.query);
    // Validate parsed Document Node
    const errors = enveloped.validate(enveloped.schema, document);
    if (errors.length > 0) {
        return { errors };
    }
    // Build the context for the execution
    return handleMaybePromise(() => enveloped.contextFactory(), contextValue => {
        const executionArgs = {
            schema: enveloped.schema,
            document,
            contextValue,
            variableValues: params.variables,
            operationName: params.operationName,
        };
        // Get the actual operation
        const operation = getOperationAST(document, params.operationName);
        // Choose the right executor
        const executeFn = operation?.operation === 'subscription' ? enveloped.subscribe : enveloped.execute;
        // Get the result to be processed
        return executeFn(executionArgs);
    });
}
