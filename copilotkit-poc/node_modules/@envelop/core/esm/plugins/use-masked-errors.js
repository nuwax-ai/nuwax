import { handleStreamOrSingleExecutionResult } from '../utils.js';
export const DEFAULT_ERROR_MESSAGE = 'Unexpected error.';
export function isGraphQLError(error) {
    return error instanceof Error && error.name === 'GraphQLError';
}
export function isOriginalGraphQLError(error) {
    if (isGraphQLError(error)) {
        if (error.originalError != null) {
            return isOriginalGraphQLError(error.originalError);
        }
        return true;
    }
    return false;
}
function createSerializableGraphQLError(message, originalError, isDev) {
    const error = new Error(message);
    error.name = 'GraphQLError';
    if (isDev) {
        const extensions = originalError instanceof Error
            ? { message: originalError.message, stack: originalError.stack }
            : { message: String(originalError) };
        Object.defineProperty(error, 'extensions', {
            get() {
                return extensions;
            },
        });
    }
    Object.defineProperty(error, 'toJSON', {
        value() {
            return {
                message: error.message,
                extensions: error.extensions,
            };
        },
    });
    return error;
}
export const createDefaultMaskError = (isDev) => (error, message) => {
    if (isOriginalGraphQLError(error)) {
        return error;
    }
    return createSerializableGraphQLError(message, error, isDev);
};
const isDev = globalThis.process?.env?.NODE_ENV === 'development';
export const defaultMaskError = createDefaultMaskError(isDev);
const makeHandleResult = (maskError, message) => ({ result, setResult, }) => {
    if (result.errors != null) {
        setResult({
            ...result,
            errors: result.errors.map(error => maskError(error, message)),
        });
    }
};
export function useMaskedErrors(opts) {
    const maskError = opts?.maskError ?? defaultMaskError;
    const message = opts?.errorMessage || DEFAULT_ERROR_MESSAGE;
    const handleResult = makeHandleResult(maskError, message);
    return {
        onPluginInit(context) {
            context.registerContextErrorHandler(({ error, setError }) => {
                setError(maskError(error, message));
            });
        },
        onExecute() {
            return {
                onExecuteDone(payload) {
                    return handleStreamOrSingleExecutionResult(payload, handleResult);
                },
            };
        },
        onSubscribe() {
            return {
                onSubscribeResult(payload) {
                    return handleStreamOrSingleExecutionResult(payload, handleResult);
                },
                onSubscribeError({ error, setError }) {
                    setError(maskError(error, message));
                },
            };
        },
    };
}
