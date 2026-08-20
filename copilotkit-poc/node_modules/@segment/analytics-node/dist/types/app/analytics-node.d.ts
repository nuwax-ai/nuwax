import { CoreAnalytics } from '@segment/analytics-core';
import { AnalyticsSettings } from './settings';
import { Callback } from './dispatch-emit';
import { NodeEmitter } from './emitter';
import { AliasParams, GroupParams, IdentifyParams, PageParams, TrackParams, Plugin, FlushParams, CloseAndFlushParams } from './types';
export declare class Analytics extends NodeEmitter implements CoreAnalytics {
    private readonly _eventFactory;
    private _isClosed;
    private _pendingEvents;
    private readonly _closeAndFlushDefaultTimeout;
    private readonly _publisher;
    private _isFlushing;
    private readonly _queue;
    ready: Promise<void>;
    constructor(settings: AnalyticsSettings);
    get VERSION(): string;
    /**
     * Call this method to stop collecting new events and flush all existing events.
     * This method also waits for any event method-specific callbacks to be triggered,
     * and any of their subsequent promises to be resolved/rejected.
     */
    closeAndFlush({ timeout, }?: CloseAndFlushParams): Promise<void>;
    /**
     * Call this method to flush all existing events..
     * This method also waits for any event method-specific callbacks to be triggered,
     * and any of their subsequent promises to be resolved/rejected.
     */
    flush({ timeout, close, }?: FlushParams): Promise<void>;
    private _dispatch;
    /**
     * Combines two unassociated user identities.
     * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#alias
     */
    alias({ userId, previousId, context, timestamp, integrations, messageId, }: AliasParams, callback?: Callback): void;
    /**
     * Associates an identified user with a collective.
     *  @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#group
     */
    group({ timestamp, groupId, userId, anonymousId, traits, context, integrations, messageId, }: GroupParams, callback?: Callback): void;
    /**
     * Includes a unique userId and (maybe anonymousId) and any optional traits you know about them.
     * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#identify
     */
    identify({ userId, anonymousId, traits, context, timestamp, integrations, messageId, }: IdentifyParams, callback?: Callback): void;
    /**
     * The page method lets you record page views on your website, along with optional extra information about the page being viewed.
     * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#page
     */
    page({ userId, anonymousId, category, name, properties, context, timestamp, integrations, messageId, }: PageParams, callback?: Callback): void;
    /**
     * Records screen views on your app, along with optional extra information
     * about the screen viewed by the user.
     *
     * TODO: This is not documented on the segment docs ATM (for node).
     */
    screen({ userId, anonymousId, category, name, properties, context, timestamp, integrations, messageId, }: PageParams, callback?: Callback): void;
    /**
     * Records actions your users perform.
     * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#track
     */
    track({ userId, anonymousId, event, properties, context, timestamp, integrations, messageId, }: TrackParams, callback?: Callback): void;
    /**
     * Registers one or more plugins to augment Analytics functionality.
     * @param plugins
     */
    register(...plugins: Plugin[]): Promise<void>;
    /**
     * Deregisters one or more plugins based on their names.
     * @param pluginNames - The names of one or more plugins to deregister.
     */
    deregister(...pluginNames: string[]): Promise<void>;
}
//# sourceMappingURL=analytics-node.d.ts.map