import type { GraphQLParams } from '../../types.cjs';
import type { Plugin } from '../types.cjs';
export declare function assertInvalidParams(params: unknown, extraParamNames?: string[]): asserts params is GraphQLParams;
export declare function checkGraphQLQueryParams(params: unknown, extraParamNames?: string[]): GraphQLParams;
export declare function isValidGraphQLParams(params: unknown): params is GraphQLParams;
export declare function useCheckGraphQLQueryParams(extraParamNames?: string[]): Plugin;
