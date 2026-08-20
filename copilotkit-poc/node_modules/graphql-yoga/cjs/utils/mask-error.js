"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskError = void 0;
const utils_1 = require("@graphql-tools/utils");
const error_js_1 = require("../error.js");
function serializeError(error) {
    if ((0, error_js_1.isGraphQLError)(error)) {
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
const maskError = (error, message, isDev = globalThis.process?.env?.['NODE_ENV'] === 'development') => {
    if ((0, error_js_1.isOriginalGraphQLError)(error)) {
        return error;
    }
    const errorExtensions = {
        code: 'INTERNAL_SERVER_ERROR',
        unexpected: true,
    };
    const errorOptions = {
        extensions: errorExtensions,
    };
    if ((0, error_js_1.isGraphQLError)(error)) {
        errorOptions.nodes = error.nodes;
        errorOptions.source = error.source;
        errorOptions.positions = error.positions;
        errorOptions.path = error.path;
        errorOptions.coordinate = (0, utils_1.getSchemaCoordinate)(error);
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
    return (0, utils_1.createGraphQLError)(message, errorOptions);
};
exports.maskError = maskError;
