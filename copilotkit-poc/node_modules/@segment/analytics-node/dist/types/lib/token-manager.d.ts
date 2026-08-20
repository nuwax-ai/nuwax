import { HTTPClient } from './http-client';
import type { AccessToken, OAuthSettings, TokenManager as ITokenManager } from './types';
export interface TokenManagerSettings extends OAuthSettings {
    httpClient: HTTPClient;
    maxRetries: number;
}
export declare class TokenManager implements ITokenManager {
    private alg;
    private grantType;
    private clientAssertionType;
    private clientId;
    private clientKey;
    private keyId;
    private scope;
    private authServer;
    private httpClient;
    private maxRetries;
    private clockSkewInSeconds;
    private accessToken?;
    private tokenEmitter;
    private retryCount;
    private pollerTimer?;
    constructor(props: TokenManagerSettings);
    stopPoller(): void;
    pollerLoop(): Promise<void>;
    private handleTransientError;
    private handleInvalidCustomResponse;
    private handleRateLimited;
    private handleUnrecoverableErrors;
    private updateClockSkew;
    private incrementRetries;
    private queueNextPoll;
    /**
     * Solely responsible for building the HTTP request and calling the token service.
     */
    private requestAccessToken;
    getAccessToken(): Promise<AccessToken>;
    clearToken(): void;
    isValidToken(token?: AccessToken): token is AccessToken;
}
//# sourceMappingURL=token-manager.d.ts.map