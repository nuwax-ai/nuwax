"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchHTTPClient = void 0;
const abort_1 = require("./abort");
const fetch_1 = require("./fetch");
/**
 * Default HTTP client implementation using fetch
 */
class FetchHTTPClient {
    _fetch;
    constructor(fetchFn) {
        this._fetch = fetchFn ?? fetch_1.fetch;
    }
    async makeRequest(options) {
        const [signal, timeoutId] = (0, abort_1.abortSignalAfterTimeout)(options.httpRequestTimeout);
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
exports.FetchHTTPClient = FetchHTTPClient;
//# sourceMappingURL=http-client.js.map