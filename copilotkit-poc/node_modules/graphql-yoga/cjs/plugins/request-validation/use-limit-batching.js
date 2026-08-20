"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLimitBatching = useLimitBatching;
const utils_1 = require("@graphql-tools/utils");
function useLimitBatching(limit) {
    return {
        onRequestParse() {
            return {
                onRequestParseDone({ requestParserResult }) {
                    if (Array.isArray(requestParserResult)) {
                        if (!limit) {
                            throw (0, utils_1.createGraphQLError)(`Batching is not supported.`, {
                                extensions: {
                                    http: {
                                        status: 400,
                                    },
                                    code: 'BAD_REQUEST',
                                },
                            });
                        }
                        if (requestParserResult.length > limit) {
                            throw (0, utils_1.createGraphQLError)(`Batching is limited to ${limit} operations per request.`, {
                                extensions: {
                                    http: {
                                        status: 413,
                                    },
                                    code: 'BAD_REQUEST',
                                },
                            });
                        }
                    }
                },
            };
        },
    };
}
