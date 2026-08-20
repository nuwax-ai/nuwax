import { ExecuteFunction, ParseFunction, SubscribeFunction, ValidateFunction } from './graphql.js';
import { Plugin } from './plugin.js';
import { ArbitraryObject, PromiseOrValue, Spread } from './utils.js';
export { ArbitraryObject } from './utils.js';
export type EnvelopContextFnWrapper<TFunction extends Function, ContextType = unknown> = (context: ContextType) => TFunction;
export type GetEnvelopedFn<PluginsContext> = {
    <InitialContext extends ArbitraryObject>(initialContext?: InitialContext): {
        execute: ExecuteFunction;
        validate: ValidateFunction;
        subscribe: SubscribeFunction;
        parse: ParseFunction;
        contextFactory: <ContextExtension>(contextExtension?: ContextExtension) => PromiseOrValue<Spread<[InitialContext, PluginsContext, ContextExtension]>>;
        schema: any;
    };
    _plugins: Plugin[];
};
