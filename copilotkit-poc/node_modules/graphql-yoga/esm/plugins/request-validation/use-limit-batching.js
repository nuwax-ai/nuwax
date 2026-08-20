import { createGraphQLError } from '@graphql-tools/utils';
export function useLimitBatching(limit) {
    return {
        onRequestParse() {
            return {
                onRequestParseDone({ requestParserResult }) {
                    if (Array.isArray(requestParserResult)) {
                        if (!limit) {
                            throw createGraphQLError(`Batching is not supported.`, {
                                extensions: {
                                    http: {
                                        status: 400,
                                    },
                                    code: 'BAD_REQUEST',
                                },
                            });
                        }
                        if (requestParserResult.length > limit) {
                            throw createGraphQLError(`Batching is limited to ${limit} operations per request.`, {
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
