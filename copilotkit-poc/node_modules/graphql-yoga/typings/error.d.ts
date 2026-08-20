import { GraphQLError } from 'graphql';
import type { YogaLogger } from '@graphql-yoga/logger';
import type { ResultProcessorInput } from './plugins/types.js';
import type { GraphQLHTTPExtensions, YogaMaskedErrorOpts } from './types.js';
declare module 'graphql' {
    interface GraphQLErrorExtensions {
        http?: GraphQLHTTPExtensions;
        unexpected?: boolean;
    }
}
export declare function isGraphQLError(val: unknown): val is GraphQLError;
export declare function isOriginalGraphQLError(val: unknown): val is GraphQLError & {
    originalError: GraphQLError;
};
export declare function isAbortError(error: unknown): error is DOMException;
export declare function handleError(error: unknown, maskedErrorsOpts: YogaMaskedErrorOpts | null, logger: YogaLogger): GraphQLError[];
export declare function getResponseInitByRespectingErrors(result: ResultProcessorInput, headers?: Record<string, string>, isApplicationJson?: boolean): {
    status: number;
    headers: Record<string, string>;
};
export declare function areGraphQLErrors(obj: unknown): obj is readonly GraphQLError[];
