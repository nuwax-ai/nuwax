"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRegularResult = processRegularResult;
const utils_1 = require("@graphql-tools/utils");
const error_js_1 = require("../../error.js");
const stringify_js_1 = require("./stringify.js");
function processRegularResult(executionResult, fetchAPI, acceptedHeader) {
    if ((0, utils_1.isAsyncIterable)(executionResult)) {
        return new fetchAPI.Response(null, {
            status: 406,
            statusText: 'Not Acceptable',
            headers: {
                accept: 'application/json; charset=utf-8, application/graphql-response+json; charset=utf-8',
            },
        });
    }
    const headersInit = {
        'Content-Type': acceptedHeader + '; charset=utf-8',
    };
    const responseInit = (0, error_js_1.getResponseInitByRespectingErrors)(executionResult, headersInit, 
    // prefer 200 only if accepting application/json and all errors are exclusively GraphQL errors
    acceptedHeader === 'application/json' &&
        !Array.isArray(executionResult) &&
        (0, error_js_1.areGraphQLErrors)(executionResult.errors) &&
        executionResult.errors.some(err => !err.extensions?.['originalError'] || (0, error_js_1.isGraphQLError)(err.extensions['originalError'])));
    const responseBody = (0, stringify_js_1.jsonStringifyResultWithoutInternals)(executionResult);
    return new fetchAPI.Response(responseBody, responseInit);
}
