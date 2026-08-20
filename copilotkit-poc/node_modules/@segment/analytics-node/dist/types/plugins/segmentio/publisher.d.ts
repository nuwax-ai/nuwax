import type { Context } from '../../app/context';
import { NodeEmitter } from '../../app/emitter';
import { HTTPClient } from '../../lib/http-client';
import { OAuthSettings } from '../../lib/types';
export interface PublisherProps {
    host?: string;
    path?: string;
    flushInterval: number;
    flushAt: number;
    maxRetries: number;
    writeKey: string;
    httpRequestTimeout?: number;
    disable?: boolean;
    httpClient: HTTPClient;
    oauthSettings?: OAuthSettings;
}
/**
 * The Publisher is responsible for batching events and sending them to the Segment API.
 */
export declare class Publisher {
    private pendingFlushTimeout?;
    private _batch?;
    private _flushInterval;
    private _flushAt;
    private _maxRetries;
    private _url;
    private _flushPendingItemsCount?;
    private _httpRequestTimeout;
    private _emitter;
    private _disable;
    private _httpClient;
    private _writeKey;
    private _tokenManager;
    constructor({ host, path, maxRetries, flushAt, flushInterval, writeKey, httpRequestTimeout, httpClient, disable, oauthSettings, }: PublisherProps, emitter: NodeEmitter);
    private createBatch;
    private clearBatch;
    flush(pendingItemsCount: number): void;
    /**
     * Enqueues the context for future delivery.
     * @param ctx - Context containing a Segment event.
     * @returns a promise that resolves with the context after the event has been delivered.
     */
    enqueue(ctx: Context): Promise<Context>;
    private send;
}
//# sourceMappingURL=publisher.d.ts.map