import { GraphQLSchema } from 'graphql';
import { ExecutionResult, Executor, MaybeAsyncIterable, MaybePromise } from '@graphql-tools/utils';
import { ExecutionArgs } from './execute.cjs';
export declare function normalizedExecutor<TData = any, TVariables = any, TContext = any>(args: ExecutionArgs<TData, TVariables, TContext>): MaybePromise<MaybeAsyncIterable<ExecutionResult<TData>>>;
export declare const executorFromSchema: (schema: GraphQLSchema) => Executor;
