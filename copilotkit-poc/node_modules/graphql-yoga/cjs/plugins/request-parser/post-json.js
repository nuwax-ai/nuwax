"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPOSTJsonRequest = isPOSTJsonRequest;
exports.parsePOSTJsonRequest = parsePOSTJsonRequest;
const graphql_1 = require("graphql");
const utils_1 = require("@graphql-tools/utils");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const utils_js_1 = require("./utils.js");
function isPOSTJsonRequest(request) {
    return (request.method === 'POST' &&
        ((0, utils_js_1.isContentTypeMatch)(request, 'application/json') ||
            (0, utils_js_1.isContentTypeMatch)(request, 'application/graphql+json')));
}
function parsePOSTJsonRequest(request) {
    return (0, promise_helpers_1.handleMaybePromise)(() => request.json(), (requestBody) => {
        if (requestBody == null) {
            throw (0, utils_1.createGraphQLError)(`POST body is expected to be object but received ${requestBody}`, {
                extensions: {
                    http: {
                        status: 400,
                    },
                    code: 'BAD_REQUEST',
                },
            });
        }
        const requestBodyTypeof = typeof requestBody;
        if (requestBodyTypeof !== 'object') {
            throw (0, utils_1.createGraphQLError)(`POST body is expected to be object but received ${requestBodyTypeof}`, {
                extensions: {
                    http: {
                        status: 400,
                    },
                    code: 'BAD_REQUEST',
                },
            });
        }
        return requestBody;
    }, err => {
        if (err instanceof graphql_1.GraphQLError) {
            throw err;
        }
        const extensions = {
            http: {
                spec: true,
                status: 400,
            },
            code: 'BAD_REQUEST',
        };
        if (err instanceof Error) {
            extensions['originalError'] = {
                name: err.name,
                message: err.message,
            };
        }
        throw (0, utils_1.createGraphQLError)('POST body sent invalid JSON.', {
            extensions,
        });
    });
}
