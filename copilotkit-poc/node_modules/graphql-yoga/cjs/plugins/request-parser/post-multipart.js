"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPOSTMultipartRequest = isPOSTMultipartRequest;
exports.parsePOSTMultipartRequest = parsePOSTMultipartRequest;
const utils_1 = require("@graphql-tools/utils");
const promise_helpers_1 = require("@whatwg-node/promise-helpers");
const utils_js_1 = require("./utils.js");
function isPOSTMultipartRequest(request) {
    return request.method === 'POST' && (0, utils_js_1.isContentTypeMatch)(request, 'multipart/form-data');
}
function parsePOSTMultipartRequest(request) {
    return (0, promise_helpers_1.handleMaybePromise)(() => request.formData(), (requestBody) => {
        const operationsStr = requestBody.get('operations');
        if (!operationsStr) {
            throw (0, utils_1.createGraphQLError)('Missing multipart form field "operations"');
        }
        if (typeof operationsStr !== 'string') {
            throw (0, utils_1.createGraphQLError)('Multipart form field "operations" must be a string');
        }
        let operations;
        try {
            operations = JSON.parse(operationsStr);
        }
        catch {
            throw (0, utils_1.createGraphQLError)('Multipart form field "operations" must be a valid JSON string');
        }
        const mapStr = requestBody.get('map');
        if (mapStr != null) {
            if (typeof mapStr !== 'string') {
                throw (0, utils_1.createGraphQLError)('Multipart form field "map" must be a string');
            }
            let map;
            try {
                map = JSON.parse(mapStr);
            }
            catch {
                throw (0, utils_1.createGraphQLError)('Multipart form field "map" must be a valid JSON string');
            }
            for (const fileIndex in map) {
                const file = requestBody.get(fileIndex);
                const keys = map[fileIndex];
                for (const key of keys) {
                    setObjectKeyPath(operations, key, file);
                }
            }
        }
        return operations;
    }, e => {
        if (e instanceof Error && e.message.startsWith('File size limit exceeded: ')) {
            throw (0, utils_1.createGraphQLError)(e.message, {
                extensions: {
                    http: {
                        status: 413,
                    },
                },
            });
        }
        throw e;
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setObjectKeyPath(object, keyPath, value) {
    const keys = keyPath.split('.');
    let current = object;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return;
        }
        const isLastKey = i === keys.length - 1;
        if (isLastKey) {
            current[key] = value;
        }
        else {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
    }
}
