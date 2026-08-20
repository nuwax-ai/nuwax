"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMethodForGraphQL = isValidMethodForGraphQL;
exports.useCheckMethodForGraphQL = useCheckMethodForGraphQL;
const utils_1 = require("@graphql-tools/utils");
function isValidMethodForGraphQL(method) {
    return method === 'GET' || method === 'POST';
}
function useCheckMethodForGraphQL() {
    return {
        onRequestParse({ request }) {
            if (!isValidMethodForGraphQL(request.method)) {
                throw (0, utils_1.createGraphQLError)('GraphQL only supports GET and POST requests.', {
                    extensions: {
                        http: {
                            status: 405,
                            headers: {
                                Allow: 'GET, POST',
                            },
                        },
                        code: 'BAD_REQUEST',
                    },
                });
            }
        },
    };
}
