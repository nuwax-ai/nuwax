import { abortSignalAfterTimeout } from './abort';
import { fetch as defaultFetch } from './fetch';
/**
 * Default HTTP client implementation using fetch
 */
export class FetchHTTPClient {
    _fetch;
    constructor(fetchFn) {
        this._fetch = fetchFn ?? defaultFetch;
    }
    async makeRequest(options) {
        const [signal, timeoutId] = abortSignalAfterTimeout(options.httpRequestTimeout);
        const requestInit = {
            url: options.url,
            method: options.method,
            headers: options.headers,
            body: options.body,
            signal: signal,
        };
        return this._fetch(options.url, requestInit).finally(() => clearTimeout(timeoutId));
    }
}
//# sourceMappingURL=http-client.js.map