import { HTTPClient, HTTPFetchFn } from '../lib/http-client';
import { OAuthSettings } from '../lib/types';
export interface AnalyticsSettings {
    /**
     * Key that corresponds to your Segment.io project
     */
    writeKey: string;
    /**
     * The base URL of the API. Default: "https://api.segment.io"
     */
    host?: string;
    /**
     * The API path route. Default: "/v1/batch"
     */
    path?: string;
    /**
     * The number of times to retry flushing a batch. Default: 3
     */
    maxRetries?: number;
    /**
     * The number of events to enqueue before flushing. Default: 15.
     */
    flushAt?: number;
    /**
     * @deprecated
     * The number of events to enqueue before flushing. This is deprecated in favor of `flushAt`. Default: 15.
     */
    maxEventsInBatch?: number;
    /**
     * The number of milliseconds to wait before flushing the queue automatically. Default: 10000
     */
    flushInterval?: number;
    /**
     * The maximum number of milliseconds to wait for an http request. Default: 10000
     */
    httpRequestTimeout?: number;
    /**
     * Disable the analytics library. All calls will be a noop. Default: false.
     */
    disable?: boolean;
    /**
     * Supply a default http client implementation (such as one supporting proxy).
     * Accepts either an HTTPClient instance or a fetch function.
     * Default: an HTTP client that uses globalThis.fetch, with node-fetch as a fallback.
     */
    httpClient?: HTTPFetchFn | HTTPClient;
    /**
     * Set up OAuth2 authentication between the client and Segment's endpoints
     */
    oauthSettings?: OAuthSettings;
}
export declare const validateSettings: (settings: AnalyticsSettings) => void;
//# sourceMappingURL=settings.d.ts.map