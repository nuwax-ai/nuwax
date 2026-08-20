"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertInvalidParams = assertInvalidParams;
exports.checkGraphQLQueryParams = checkGraphQLQueryParams;
exports.isValidGraphQLParams = isValidGraphQLParams;
exports.useCheckGraphQLQueryParams = useCheckGraphQLQueryParams;
const utils_1 = require("@graphql-tools/utils");
const expectedParameters = new Set(['query', 'variables', 'operationName', 'extensions']);
function assertInvalidParams(params, extraParamNames) {
    if (params == null || typeof params !== 'object') {
        throw (0, utils_1.createGraphQLError)('Invalid "params" in the request body', {
            extensions: {
                http: {
                    spec: true,
                    status: 400,
                },
                code: 'BAD_REQUEST',
            },
        });
    }
    for (const paramKey in params) {
        if (params[paramKey] == null) {
            continue;
        }
        if (!expectedParameters.has(paramKey)) {
            if (extraParamNames?.includes(paramKey)) {
                continue;
            }
            throw (0, utils_1.createGraphQLError)(`Unexpected parameter "${paramKey}" in the request body.`, {
                extensions: {
                    http: {
                        status: 400,
                    },
                    code: 'BAD_REQUEST',
                },
            });
        }
    }
}
function checkGraphQLQueryParams(params, extraParamNames) {
    if (!isObject(params)) {
        throw (0, utils_1.createGraphQLError)(`Expected params to be an object but given ${extendedTypeof(params)}.`, {
            extensions: {
                http: {
                    status: 400,
                    headers: {
                        Allow: 'GET, POST',
                    },
                },
                code: 'BAD_REQUEST',
            },
        });
    }
    assertInvalidParams(params, extraParamNames);
    if (params['query'] == null) {
        throw (0, utils_1.createGraphQLError)('Must provide query string.', {
            extensions: {
                http: {
                    spec: true,
                    status: 400,
                    headers: {
                        Allow: 'GET, POST',
                    },
                },
                code: 'BAD_REQUEST',
            },
        });
    }
    const queryType = extendedTypeof(params['query']);
    if (queryType !== 'string') {
        throw (0, utils_1.createGraphQLError)(`Expected "query" param to be a string, but given ${queryType}.`, {
            extensions: {
                http: {
                    status: 400,
                    headers: {
                        Allow: 'GET, POST',
                    },
                },
                code: 'BAD_REQUEST',
            },
        });
    }
    const variablesParamType = extendedTypeof(params['variables']);
    if (!['object', 'null', 'undefined'].includes(variablesParamType)) {
        throw (0, utils_1.createGraphQLError)(`Expected "variables" param to be empty or an object, but given ${variablesParamType}.`, {
            extensions: {
                http: {
                    status: 400,
                    headers: {
                        Allow: 'GET, POST',
                    },
                },
                code: 'BAD_REQUEST',
            },
        });
    }
    const extensionsParamType = extendedTypeof(params['extensions']);
    if (!['object', 'null', 'undefined'].includes(extensionsParamType)) {
        throw (0, utils_1.createGraphQLError)(`Expected "extensions" param to be empty or an object, but given ${extensionsParamType}.`, {
            extensions: {
                http: {
                    status: 400,
                    headers: {
                        Allow: 'GET, POST',
                    },
                },
                code: 'BAD_REQUEST',
            },
        });
    }
    return params;
}
function isValidGraphQLParams(params) {
    try {
        checkGraphQLQueryParams(params);
        return true;
    }
    catch {
        return false;
    }
}
function useCheckGraphQLQueryParams(extraParamNames) {
    return {
        onParams({ params }) {
            checkGraphQLQueryParams(params, extraParamNames);
        },
    };
}
function extendedTypeof(val) {
    if (val === null) {
        return 'null';
    }
    if (Array.isArray(val)) {
        return 'array';
    }
    return typeof val;
}
function isObject(val) {
    return extendedTypeof(val) === 'object';
}
