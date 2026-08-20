import { ComposeContext, GetEnvelopedFn, Optional, Plugin } from '@envelop/types';
type ExcludeFalsy<TArray extends any[]> = Exclude<TArray[0], null | undefined | false>[];
export declare function envelop<PluginsType extends Optional<Plugin<any>>[]>(options: {
    plugins: PluginsType;
    enableInternalTracing?: boolean;
}): GetEnvelopedFn<ComposeContext<ExcludeFalsy<PluginsType>>>;
export {};
