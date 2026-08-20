import { ExecutionResult, Plugin, TypedExecutionArgs } from '@envelop/types';
export type FormatterFunction = (result: ExecutionResult<any, any>, args: TypedExecutionArgs<any>) => false | ExecutionResult<any, any>;
export declare const usePayloadFormatter: (formatter: FormatterFunction) => Plugin;
