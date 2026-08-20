import { HTTPClient } from './http-client'
import { TokenManagerSettings } from './token-manager'

export interface OAuthSettings {
  /**
   * The OAuth App ID from Access Management under Workspace Settings in the Segment Dashboard.
   */
  clientId: string
  /**
   * The private key that matches the public key set in the OAuth app in the Segment Dashboard.
   */
  clientKey: string
  /**
   * The ID for the matching public key as given in the Segment Dashboard after it is uploaded.
   */
  keyId: string
  /**
   * The Authorization server.  Defaults to https://oauth2.segment.io
   * If your TAPI endpoint is not https://api.segment.io you will need to set this value.
   * e.g. https://oauth2.eu1.segmentapis.com/ for TAPI endpoint https://events.eu1.segmentapis.com/
   */
  authServer?: string
  /**
   * The scope of permissions. Defaults to `tracking_api:write`.
   * Must match a scope from the OAuth app settings in the Segment Dashboard.
   */
  scope?: string
  /**
   * Custom number of retries before a recoverable error is reported.
   * Defaults to the custom value set in the Analytics settings, or 3 if unset
   */
  maxRetries?: number
  /**
   * Custom HTTP Client implementation.
   * Defaults to the custom value set in the Analytics settings, or uses the default fetch client.
   * Note: This would only be need to be set in a complex environment that may have different access
   * rules for the TAPI and Auth endpoints.
   */
  httpClient?: HTTPClient
}

export type AccessToken = {
  access_token: string
  expires_in: number
  expires_at?: number
}

export interface TokenManager {
  pollerLoop(): Promise<void>
  stopPoller(): void
  getAccessToken(): Promise<AccessToken>
  clearToken(): void
  isValidToken(token?: AccessToken): token is AccessToken
}

export interface TokenManagerConstructor {
  new (settings: TokenManagerSettings): TokenManager
}
