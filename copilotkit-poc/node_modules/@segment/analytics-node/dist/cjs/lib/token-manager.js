"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = void 0;
const uuid_1 = require("./uuid");
const jose_1 = require("jose");
const analytics_core_1 = require("@segment/analytics-core");
const analytics_generic_utils_1 = require("@segment/analytics-generic-utils");
const isAccessToken = (thing) => {
    return Boolean(thing &&
        typeof thing === 'object' &&
        'access_token' in thing &&
        'expires_in' in thing &&
        typeof thing.access_token === 'string' &&
        typeof thing.expires_in === 'number');
};
const isValidCustomResponse = (response) => {
    return typeof response.text === 'function';
};
function convertHeaders(headers) {
    const lowercaseHeaders = {};
    if (!headers)
        return {};
    if (isHeaders(headers)) {
        for (const [name, value] of headers.entries()) {
            lowercaseHeaders[name.toLowerCase()] = value;
        }
        return lowercaseHeaders;
    }
    for (const [name, value] of Object.entries(headers)) {
        lowercaseHeaders[name.toLowerCase()] = value;
    }
    return lowercaseHeaders;
}
function isHeaders(thing) {
    if (typeof thing === 'object' &&
        thing !== null &&
        'entries' in Object(thing) &&
        typeof Object(thing).entries === 'function') {
        return true;
    }
    return false;
}
class TokenManager {
    alg = 'RS256';
    grantType = 'client_credentials';
    clientAssertionType = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
    clientId;
    clientKey;
    keyId;
    scope;
    authServer;
    httpClient;
    maxRetries;
    clockSkewInSeconds = 0;
    accessToken;
    tokenEmitter = new analytics_generic_utils_1.Emitter();
    retryCount;
    pollerTimer;
    constructor(props) {
        this.keyId = props.keyId;
        this.clientId = props.clientId;
        this.clientKey = props.clientKey;
        this.authServer = props.authServer ?? 'https://oauth2.segment.io';
        this.scope = props.scope ?? 'tracking_api:write';
        this.httpClient = props.httpClient;
        this.maxRetries = props.maxRetries;
        this.tokenEmitter.on('access_token', (event) => {
            if ('token' in event) {
                this.accessToken = event.token;
            }
        });
        this.retryCount = 0;
    }
    stopPoller() {
        clearTimeout(this.pollerTimer);
    }
    async pollerLoop() {
        let timeUntilRefreshInMs = 25;
        let response;
        try {
            response = await this.requestAccessToken();
        }
        catch (err) {
            // Error without a status code - likely networking, retry
            return this.handleTransientError({ error: err });
        }
        if (!isValidCustomResponse(response)) {
            return this.handleInvalidCustomResponse();
        }
        const headers = convertHeaders(response.headers);
        if (headers['date']) {
            this.updateClockSkew(Date.parse(headers['date']));
        }
        // Handle status codes!
        if (response.status === 200) {
            try {
                const body = await response.text();
                const token = JSON.parse(body);
                if (!isAccessToken(token)) {
                    throw new Error('Response did not contain a valid access_token and expires_in');
                }
                // Success, we have a token!
                token.expires_at = Math.round(Date.now() / 1000) + token.expires_in;
                this.tokenEmitter.emit('access_token', { token });
                // Reset our failure count
                this.retryCount = 0;
                // Refresh the token after half the expiry time passes
                timeUntilRefreshInMs = (token.expires_in / 2) * 1000;
                return this.queueNextPoll(timeUntilRefreshInMs);
            }
            catch (err) {
                // Something went really wrong with the body, lets surface an error and try again?
                return this.handleTransientError({ error: err, forceEmitError: true });
            }
        }
        else if (response.status === 429) {
            // Rate limited, wait for the reset time
            return await this.handleRateLimited(response, headers, timeUntilRefreshInMs);
        }
        else if ([400, 401, 415].includes(response.status)) {
            // Unrecoverable errors, stops the poller
            return this.handleUnrecoverableErrors(response);
        }
        else {
            return this.handleTransientError({
                error: new Error(`[${response.status}] ${response.statusText}`),
            });
        }
    }
    handleTransientError({ error, forceEmitError, }) {
        this.incrementRetries({ error, forceEmitError });
        const timeUntilRefreshInMs = (0, analytics_core_1.backoff)({
            attempt: this.retryCount,
            minTimeout: 25,
            maxTimeout: 1000,
        });
        this.queueNextPoll(timeUntilRefreshInMs);
    }
    handleInvalidCustomResponse() {
        this.tokenEmitter.emit('access_token', {
            error: new Error('HTTPClient does not implement response.text method'),
        });
    }
    async handleRateLimited(response, headers, timeUntilRefreshInMs) {
        this.incrementRetries({
            error: new Error(`[${response.status}] ${response.statusText}`),
        });
        if (headers['x-ratelimit-reset']) {
            const rateLimitResetTimestamp = parseInt(headers['x-ratelimit-reset'], 10);
            if (isFinite(rateLimitResetTimestamp)) {
                timeUntilRefreshInMs =
                    rateLimitResetTimestamp - Date.now() + this.clockSkewInSeconds * 1000;
            }
            else {
                timeUntilRefreshInMs = 5 * 1000;
            }
            // We want subsequent calls to get_token to be able to interrupt our
            //  Timeout when it's waiting for e.g. a long normal expiration, but
            //  not when we're waiting for a rate limit reset. Sleep instead.
            await (0, analytics_core_1.sleep)(timeUntilRefreshInMs);
            timeUntilRefreshInMs = 0;
        }
        this.queueNextPoll(timeUntilRefreshInMs);
    }
    handleUnrecoverableErrors(response) {
        this.retryCount = 0;
        this.tokenEmitter.emit('access_token', {
            error: new Error(`[${response.status}] ${response.statusText}`),
        });
        this.stopPoller();
    }
    updateClockSkew(dateInMs) {
        this.clockSkewInSeconds = (Date.now() - dateInMs) / 1000;
    }
    incrementRetries({ error, forceEmitError, }) {
        this.retryCount++;
        if (forceEmitError || this.retryCount % this.maxRetries === 0) {
            this.retryCount = 0;
            this.tokenEmitter.emit('access_token', { error: error });
        }
    }
    queueNextPoll(timeUntilRefreshInMs) {
        this.pollerTimer = setTimeout(() => this.pollerLoop(), timeUntilRefreshInMs);
        if (this.pollerTimer.unref) {
            this.pollerTimer.unref();
        }
    }
    /**
     * Solely responsible for building the HTTP request and calling the token service.
     */
    async requestAccessToken() {
        // Set issued at time to 5 seconds in the past to account for clock skew
        const ISSUED_AT_BUFFER_IN_SECONDS = 5;
        const MAX_EXPIRY_IN_SECONDS = 60;
        // Final expiry time takes into account the issued at time, so need to subtract IAT buffer
        const EXPIRY_IN_SECONDS = MAX_EXPIRY_IN_SECONDS - ISSUED_AT_BUFFER_IN_SECONDS;
        const jti = (0, uuid_1.uuid)();
        const currentUTCInSeconds = Math.round(Date.now() / 1000) - this.clockSkewInSeconds;
        const jwtBody = {
            iss: this.clientId,
            sub: this.clientId,
            aud: this.authServer,
            iat: currentUTCInSeconds - ISSUED_AT_BUFFER_IN_SECONDS,
            exp: currentUTCInSeconds + EXPIRY_IN_SECONDS,
            jti,
        };
        const key = await (0, jose_1.importPKCS8)(this.clientKey, 'RS256');
        const signedJwt = await new jose_1.SignJWT(jwtBody)
            .setProtectedHeader({ alg: this.alg, kid: this.keyId, typ: 'JWT' })
            .sign(key);
        const requestBody = `grant_type=${this.grantType}&client_assertion_type=${this.clientAssertionType}&client_assertion=${signedJwt}&scope=${this.scope}`;
        const accessTokenEndpoint = `${this.authServer}/token`;
        const requestOptions = {
            method: 'POST',
            url: accessTokenEndpoint,
            body: requestBody,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            httpRequestTimeout: 10000,
        };
        return this.httpClient.makeRequest(requestOptions);
    }
    async getAccessToken() {
        // Use the cached token if it is still valid, otherwise wait for a new token.
        if (this.isValidToken(this.accessToken)) {
            return this.accessToken;
        }
        // stop poller first in order to make sure that it's not sleeping if we need a token immediately
        // Otherwise it could be hours before the expiration time passes normally
        this.stopPoller();
        // startPoller needs to be called somewhere, either lazily when a token is first requested, or at instantiation.
        // Doing it lazily currently
        this.pollerLoop().catch(() => { });
        return new Promise((resolve, reject) => {
            this.tokenEmitter.once('access_token', (event) => {
                if ('token' in event) {
                    resolve(event.token);
                }
                else {
                    reject(event.error);
                }
            });
        });
    }
    clearToken() {
        this.accessToken = undefined;
    }
    isValidToken(token) {
        return (typeof token !== 'undefined' &&
            token !== null &&
            token.expires_in < Date.now() / 1000);
    }
}
exports.TokenManager = TokenManager;
//# sourceMappingURL=token-manager.js.map