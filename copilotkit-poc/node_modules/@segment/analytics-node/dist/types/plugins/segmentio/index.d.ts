import { Publisher, PublisherProps } from './publisher';
import { Plugin } from '../../app/types';
import { NodeEmitter } from '../../app/emitter';
type DefinedPluginFields = 'name' | 'type' | 'version' | 'isLoaded' | 'load' | 'alias' | 'group' | 'identify' | 'page' | 'screen' | 'track';
type SegmentNodePlugin = Plugin & Required<Pick<Plugin, DefinedPluginFields>>;
export type ConfigureNodePluginProps = PublisherProps;
export declare function createNodePlugin(publisher: Publisher): SegmentNodePlugin;
export declare const createConfiguredNodePlugin: (props: ConfigureNodePluginProps, emitter: NodeEmitter) => {
    publisher: Publisher;
    plugin: SegmentNodePlugin;
};
export {};
//# sourceMappingURL=index.d.ts.map