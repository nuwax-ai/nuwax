import { AnalyticsEvents } from "./events.cjs";
import { Analytics } from "@segment/analytics-node";

//#region src/telemetry/telemetry-client.d.ts
/**
 * Checks if telemetry is disabled via environment variables.
 * Users can opt out by setting:
 * - COPILOTKIT_TELEMETRY_DISABLED=true or COPILOTKIT_TELEMETRY_DISABLED=1
 * - DO_NOT_TRACK=true or DO_NOT_TRACK=1
 */
declare function isTelemetryDisabled(): boolean;
declare class TelemetryClient {
  segment: Analytics | undefined;
  globalProperties: Record<string, any>;
  cloudConfiguration: {
    publicApiKey: string;
    baseUrl: string;
  } | null;
  private licenseToken;
  private telemetryId;
  packageName: string;
  packageVersion: string;
  private telemetryDisabled;
  private sampleRate;
  private anonymousId;
  constructor({
    packageName,
    packageVersion,
    telemetryDisabled,
    telemetryBaseUrl,
    sampleRate
  }: {
    packageName: string;
    packageVersion: string;
    telemetryDisabled?: boolean;
    telemetryBaseUrl?: string;
    sampleRate?: number;
  });
  private shouldSendEvent;
  capture<K extends keyof AnalyticsEvents>(event: K, properties: AnalyticsEvents[K]): Promise<void>;
  setGlobalProperties(properties: Record<string, any>): void;
  setCloudConfiguration(properties: {
    publicApiKey: string;
    baseUrl: string;
  }): void;
  setLicenseToken(licenseToken: string): void;
  private setSampleRate;
}
//#endregion
export { TelemetryClient, isTelemetryDisabled };
//# sourceMappingURL=telemetry-client.d.cts.map