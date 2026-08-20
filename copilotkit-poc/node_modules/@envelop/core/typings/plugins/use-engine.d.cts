import { ExecuteFunction, ParseFunction, Plugin, SubscribeFunction, ValidateFunction } from '@envelop/types';
type UseEngineOptions = {
    execute?: ExecuteFunction;
    parse?: ParseFunction;
    validate?: ValidateFunction;
    specifiedRules?: readonly any[];
    subscribe?: SubscribeFunction;
};
export declare const useEngine: (engine: UseEngineOptions) => Plugin;
export {};
