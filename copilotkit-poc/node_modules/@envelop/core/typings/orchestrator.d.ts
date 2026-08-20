import { ArbitraryObject, DefaultContext, EnvelopContextFnWrapper, GetEnvelopedFn, Instrumentation, Maybe, Plugin } from '@envelop/types';
export type EnvelopOrchestrator<InitialContext extends ArbitraryObject = ArbitraryObject, PluginsContext extends ArbitraryObject = ArbitraryObject> = {
    init: (initialContext?: Maybe<InitialContext>) => void;
    parse: EnvelopContextFnWrapper<ReturnType<GetEnvelopedFn<PluginsContext>>['parse'], InitialContext>;
    validate: EnvelopContextFnWrapper<ReturnType<GetEnvelopedFn<PluginsContext>>['validate'], InitialContext>;
    execute: ReturnType<GetEnvelopedFn<PluginsContext>>['execute'];
    subscribe: ReturnType<GetEnvelopedFn<PluginsContext>>['subscribe'];
    contextFactory: EnvelopContextFnWrapper<ReturnType<GetEnvelopedFn<PluginsContext>>['contextFactory'], PluginsContext>;
    getCurrentSchema: () => Maybe<any>;
    instrumentation?: Instrumentation<PluginsContext>;
};
type EnvelopOrchestratorOptions = {
    plugins: Plugin[];
};
export declare function createEnvelopOrchestrator<PluginsContext extends DefaultContext>({ plugins, }: EnvelopOrchestratorOptions): EnvelopOrchestrator<any, PluginsContext>;
export {};
