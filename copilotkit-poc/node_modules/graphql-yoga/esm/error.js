import { GraphQLError } from 'graphql';
import { createGraphQLError } from '@graphql-tools/utils';
function isAggregateError(obj) {
    return obj != null && typeof obj === 'object' && 'errors' in obj;
}
function hasToString(obj) {
    return obj != null && typeof obj.toString === 'function';
}
export function isGraphQLError(val) {
    return val instanceof GraphQLError;
}
export function isOriginalGraphQLError(val) {
    if (val instanceof GraphQLError) {
        if (val.originalError != null) {
            return isOriginalGraphQLError(val.originalError);
        }
        return true;
    }
    return false;
}
export function isAbortError(error) {
    return (typeof error === 'object' &&
        error?.constructor?.name === 'DOMException' &&
        (error.name === 'AbortError' ||
            error.name === 'TimeoutError'));
}
export function handleError(error, maskedErrorsOpts, logger) {
    const errors = new Set();
    if (isAggregateError(error)) {
        for (const singleError of error.errors) {
            const handledErrors = handleError(singleError, maskedErrorsOpts, logger);
            for (const handledError of handledErrors) {
                errors.add(handledError);
            }
        }
    }
    else if (isAbortError(error)) {
        logger.debug('Request aborted');
    }
    else if (maskedErrorsOpts) {
        const maskedError = maskedErrorsOpts.maskError(error, maskedErrorsOpts.errorMessage, maskedErrorsOpts.isDev);
        if (maskedError !== error) {
            logger.error(error);
        }
        errors.add(isGraphQLError(maskedError)
            ? maskedError
            : createGraphQLError(maskedError.message, {
                originalError: maskedError,
            }));
    }
    else if (isGraphQLError(error)) {
        errors.add(error);
    }
    else if (error instanceof Error) {
        errors.add(createGraphQLError(error.message, {
            originalError: error,
        }));
    }
    else if (typeof error === 'string') {
        errors.add(createGraphQLError(error, {
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                unexpected: true,
            },
        }));
    }
    else if (hasToString(error)) {
        errors.add(createGraphQLError(error.toString(), {
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                unexpected: true,
            },
        }));
    }
    else {
        logger.error(error);
        errors.add(createGraphQLError('Unexpected error.', {
            extensions: {
                unexpected: true,
            },
        }));
    }
    return Array.from(errors);
}
export function getResponseInitByRespectingErrors(result, headers = {}, isApplicationJson = false) {
    let status;
    let unexpectedErrorExists = false;
    if ('extensions' in result && result.extensions?.http) {
        if (result.extensions.http.headers) {
            Object.assign(headers, result.extensions.http.headers);
        }
        if (result.extensions.http.status) {
            status = result.extensions.http.status;
        }
    }
    if ('errors' in result && result.errors?.length) {
        for (const error of result.errors) {
            if (error.extensions?.['http']) {
                if (error.extensions['http'].headers) {
                    Object.assign(headers, error.extensions['http'].headers);
                }
                if (isApplicationJson && error.extensions['http'].spec) {
                    continue;
                }
                if (error.extensions['http'].status &&
                    (!status || error.extensions['http'].status > status)) {
                    status = error.extensions['http'].status;
                }
            }
            else if (!isOriginalGraphQLError(error) || error.extensions?.['unexpected']) {
                unexpectedErrorExists = true;
            }
        }
    }
    else {
        status ||= 200;
    }
    if (!status) {
        if (unexpectedErrorExists && !('data' in result)) {
            status = 500;
        }
        else {
            status = 200;
        }
    }
    return {
        status,
        headers,
    };
}
export function areGraphQLErrors(obj) {
    return (Array.isArray(obj) &&
        obj.length > 0 &&
        // if one item in the array is a GraphQLError, we're good
        obj.some(isGraphQLError));
}
