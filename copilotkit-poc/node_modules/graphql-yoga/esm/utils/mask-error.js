import { createGraphQLError, getSchemaCoordinate } from '@graphql-tools/utils';
import { isGraphQLError, isOriginalGraphQLError } from '../error.js';
function serializeError(error) {
    if (isGraphQLError(error)) {
        return error.toJSON();
    }
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
        };
    }
    return error;
}
export const maskError = (error, message, isDev = globalThis.process?.env?.['NODE_ENV'] === 'development') => {
    if (isOriginalGraphQLError(error)) {
        return error;
    }
    const errorExtensions = {
        code: 'INTERNAL_SERVER_ERROR',
        unexpected: true,
    };
    const errorOptions = {
        extensions: errorExtensions,
    };
    if (isGraphQLError(error)) {
        errorOptions.nodes = error.nodes;
        errorOptions.source = error.source;
        errorOptions.positions = error.positions;
        errorOptions.path = error.path;
        errorOptions.coordinate = getSchemaCoordinate(error);
        if (isDev && error.originalError) {
            errorExtensions['originalError'] = serializeError(error.originalError);
        }
        if (error.extensions?.['http']) {
            errorExtensions['http'] = error.extensions['http'];
        }
    }
    else if (isDev) {
        errorExtensions['originalError'] = serializeError(error);
    }
    return createGraphQLError(message, errorOptions);
};
