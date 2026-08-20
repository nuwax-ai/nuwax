import { ExecuteFunction, ParseFunction, SubscribeFunction, ValidateFunction } from './graphql.cjs';
import { Plugin } from './plugin.cjs';
import { ArbitraryObject, PromiseOrValue, Spread } from './utils.cjs';
export { ArbitraryObject } from './utils.cjs';
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
