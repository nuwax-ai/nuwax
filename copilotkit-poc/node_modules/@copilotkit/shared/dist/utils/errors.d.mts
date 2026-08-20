import { GraphQLError } from "graphql";

//#region src/utils/errors.d.ts
declare enum Severity {
  CRITICAL = "critical",
  // Critical errors that block core functionality
  WARNING = "warning",
  // Configuration/setup issues that need attention
  INFO = "info"
}
declare enum ErrorVisibility {
  BANNER = "banner",
  // Critical errors shown as fixed banners
  TOAST = "toast",
  // Regular errors shown as dismissible toasts
  SILENT = "silent",
  // Errors logged but not shown to user
  DEV_ONLY = "dev_only"
}
declare const ERROR_NAMES: {
  readonly COPILOT_ERROR: "CopilotError";
  readonly COPILOT_API_DISCOVERY_ERROR: "CopilotApiDiscoveryError";
  readonly COPILOT_REMOTE_ENDPOINT_DISCOVERY_ERROR: "CopilotKitRemoteEndpointDiscoveryError";
  readonly COPILOT_KIT_AGENT_DISCOVERY_ERROR: "CopilotKitAgentDiscoveryError";
  readonly COPILOT_KIT_LOW_LEVEL_ERROR: "CopilotKitLowLevelError";
  readonly COPILOT_KIT_VERSION_MISMATCH_ERROR: "CopilotKitVersionMismatchError";
  readonly RESOLVED_COPILOT_KIT_ERROR: "ResolvedCopilotKitError";
  readonly CONFIGURATION_ERROR: "ConfigurationError";
  readonly MISSING_PUBLIC_API_KEY_ERROR: "MissingPublicApiKeyError";
  readonly UPGRADE_REQUIRED_ERROR: "UpgradeRequiredError";
};
declare const BANNER_ERROR_NAMES: ("CopilotApiDiscoveryError" | "CopilotKitRemoteEndpointDiscoveryError" | "CopilotKitAgentDiscoveryError" | "ConfigurationError" | "MissingPublicApiKeyError" | "UpgradeRequiredError")[];
declare const COPILOT_CLOUD_ERROR_NAMES: ("CopilotApiDiscoveryError" | "CopilotKitRemoteEndpointDiscoveryError" | "CopilotKitAgentDiscoveryError" | "ConfigurationError" | "MissingPublicApiKeyError" | "UpgradeRequiredError")[];
declare enum CopilotKitErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  NOT_FOUND = "NOT_FOUND",
  AGENT_NOT_FOUND = "AGENT_NOT_FOUND",
  API_NOT_FOUND = "API_NOT_FOUND",
  REMOTE_ENDPOINT_NOT_FOUND = "REMOTE_ENDPOINT_NOT_FOUND",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  MISUSE = "MISUSE",
  UNKNOWN = "UNKNOWN",
  VERSION_MISMATCH = "VERSION_MISMATCH",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  MISSING_PUBLIC_API_KEY_ERROR = "MISSING_PUBLIC_API_KEY_ERROR",
  UPGRADE_REQUIRED_ERROR = "UPGRADE_REQUIRED_ERROR"
}
declare const ERROR_CONFIG: {
  NETWORK_ERROR: {
    statusCode: number;
    troubleshootingUrl: string;
    visibility: ErrorVisibility;
    severity: Severity;
  };
  NOT_FOUND: {
    statusCode: number;
    troubleshootingUrl: string;
    visibility: ErrorVisibility;
    severity: Severity;
  };
  AGENT_NOT_FOUND: {
    statusCode: number;
    troubleshootingUrl: string;
    visibility: ErrorVisibility;
    severity: Severity;
  };
  API_NOT_FOUND: {
    statusCode: number;
    troubleshootingUrl: string;
    visibility: ErrorVisibility;
    severity: Severity;
  };
  REMOTE_ENDPOINT_NOT_FOUND: {
    statusCode: number;
    troubleshootingUrl: string;
    visibility: ErrorVisibility;
    severity: Severity;
  };
  AUTHENTICATION_ERROR: {
    statusCode: number;
    troubleshootingUrl: string;
    visibility: ErrorVisibility;
    severity: Severity;
  };
  MISUSE: {
    statusCode: number;
    troubleshootingUrl: null;
    visibility: ErrorVisibility;
    severity: Severity;
  };
  UNKNOWN: {
    statusCode: number;
    visibility: ErrorVisibility;
    severity: Severity;
  };
  CONFIGURATION_ERROR: {
    statusCode: number;
    troubleshootingUrl: null;
    severity: Severity;
    visibility: ErrorVisibility;
  };
  MISSING_PUBLIC_API_KEY_ERROR: {
    statusCode: number;
    troubleshootingUrl: null;
    severity: Severity;
    visibility: ErrorVisibility;
  };
  UPGRADE_REQUIRED_ERROR: {
    statusCode: number;
    troubleshootingUrl: null;
    severity: Severity;
    visibility: ErrorVisibility;
  };
  VERSION_MISMATCH: {
    statusCode: number;
    troubleshootingUrl: null;
    visibility: ErrorVisibility;
    severity: Severity;
  };
};
declare class CopilotKitError extends GraphQLError {
  code: CopilotKitErrorCode;
  statusCode: number;
  severity?: Severity;
  visibility: ErrorVisibility;
  constructor({
    message,
    code,
    severity,
    visibility
  }: {
    message?: string;
    code: CopilotKitErrorCode;
    severity?: Severity;
    visibility?: ErrorVisibility;
  });
}
/**
 * Error thrown when we can identify wrong usage of our components.
 * This helps us notify the developer before real errors can happen
 *
 * @extends CopilotKitError
 */
declare class CopilotKitMisuseError extends CopilotKitError {
  constructor({
    message,
    code
  }: {
    message: string;
    code?: CopilotKitErrorCode;
  });
}
/**
 * Error thrown when CPK versions does not match
 *
 * @extends CopilotKitError
 */
declare class CopilotKitVersionMismatchError extends CopilotKitError {
  constructor({
    reactCoreVersion,
    runtimeVersion,
    runtimeClientGqlVersion
  }: VersionMismatchResponse);
}
/**
 * Error thrown when the CopilotKit API endpoint cannot be discovered or accessed.
 * This typically occurs when:
 * - The API endpoint URL is invalid or misconfigured
 * - The API service is not running at the expected location
 * - There are network/firewall issues preventing access
 *
 * @extends CopilotKitError
 */
declare class CopilotKitApiDiscoveryError extends CopilotKitError {
  constructor(params?: {
    message?: string;
    code?: CopilotKitErrorCode.API_NOT_FOUND | CopilotKitErrorCode.REMOTE_ENDPOINT_NOT_FOUND;
    url?: string;
  });
}
/**
 * This error is used for endpoints specified in runtime's remote endpoints. If they cannot be contacted
 * This typically occurs when:
 * - The API endpoint URL is invalid or misconfigured
 * - The API service is not running at the expected location
 *
 * @extends CopilotKitApiDiscoveryError
 */
declare class CopilotKitRemoteEndpointDiscoveryError extends CopilotKitApiDiscoveryError {
  constructor(params?: {
    message?: string;
    url?: string;
  });
}
/**
 * Error thrown when a LangGraph agent cannot be found or accessed.
 * This typically occurs when:
 * - The specified agent name does not exist in the deployment
 * - The agent configuration is invalid or missing
 * - The agent service is not properly deployed or initialized
 *
 * @extends CopilotKitError
 */
declare class CopilotKitAgentDiscoveryError extends CopilotKitError {
  constructor(params: {
    agentName?: string;
    availableAgents: {
      name: string;
      id: string;
    }[];
  });
}
/**
 * Handles low-level networking errors that occur before a request reaches the server.
 * These errors arise from issues in the underlying communication infrastructure rather than
 * application-level logic or server responses. Typically used to handle "fetch failed" errors
 * where no HTTP status code is available.
 *
 * Common scenarios include:
 * - Connection failures (ECONNREFUSED) when server is down/unreachable
 * - DNS resolution failures (ENOTFOUND) when domain can't be resolved
 * - Timeouts (ETIMEDOUT) when request takes too long
 * - Protocol/transport layer errors like SSL/TLS issues
 */
declare class CopilotKitLowLevelError extends CopilotKitError {
  constructor({
    error,
    url,
    message
  }: {
    error: Error;
    url: string;
    message?: string;
  });
}
/**
 * Generic catch-all error handler for HTTP responses from the CopilotKit API where a status code is available.
 * Used when we receive an HTTP error status and wish to handle broad range of them
 *
 * This differs from CopilotKitLowLevelError in that:
 * - ResolvedCopilotKitError: Server was reached and returned an HTTP status
 * - CopilotKitLowLevelError: Error occurred before reaching server (e.g. network failure)
 *
 * @param status - The HTTP status code received from the API response
 * @param message - Optional error message to include
 * @param code - Optional specific CopilotKitErrorCode to override default behavior
 *
 * Default behavior:
 * - 400 Bad Request: Maps to CopilotKitApiDiscoveryError
 * - All other status codes: Maps to UNKNOWN error code if no specific code provided
 */
declare class ResolvedCopilotKitError extends CopilotKitError {
  constructor({
    status,
    message,
    code,
    isRemoteEndpoint,
    url
  }: {
    status: number;
    message?: string;
    code?: CopilotKitErrorCode;
    isRemoteEndpoint?: boolean;
    url?: string;
  });
}
declare class ConfigurationError extends CopilotKitError {
  constructor(message: string);
}
declare class MissingPublicApiKeyError extends ConfigurationError {
  constructor(message: string);
}
declare class UpgradeRequiredError extends ConfigurationError {
  constructor(message: string);
}
/**
 * Checks if an error is already a structured CopilotKit error.
 * This utility centralizes the logic for detecting structured errors across the codebase.
 *
 * @param error - The error to check
 * @returns true if the error is already structured, false otherwise
 */
declare function isStructuredCopilotKitError(error: any): boolean;
/**
 * Returns the error as-is if it's already structured, otherwise converts it using the provided converter function.
 * This utility centralizes the pattern of preserving structured errors while converting unstructured ones.
 *
 * @param error - The error to process
 * @param converter - Function to convert unstructured errors to structured ones
 * @returns The structured error
 */
declare function ensureStructuredError<T extends CopilotKitError>(error: any, converter: (error: any) => T): T | any;
interface VersionMismatchResponse {
  runtimeVersion?: string;
  runtimeClientGqlVersion: string;
  reactCoreVersion: string;
}
declare function getPossibleVersionMismatch({
  runtimeVersion,
  runtimeClientGqlVersion
}: {
  runtimeVersion?: string;
  runtimeClientGqlVersion: string;
}): Promise<{
  runtimeVersion: string;
  runtimeClientGqlVersion: string;
  reactCoreVersion: string;
  message: string;
} | undefined>;
//#endregion
export { BANNER_ERROR_NAMES, COPILOT_CLOUD_ERROR_NAMES, ConfigurationError, CopilotKitAgentDiscoveryError, CopilotKitApiDiscoveryError, CopilotKitError, CopilotKitErrorCode, CopilotKitLowLevelError, CopilotKitMisuseError, CopilotKitRemoteEndpointDiscoveryError, CopilotKitVersionMismatchError, ERROR_CONFIG, ERROR_NAMES, ErrorVisibility, MissingPublicApiKeyError, ResolvedCopilotKitError, Severity, UpgradeRequiredError, ensureStructuredError, getPossibleVersionMismatch, isStructuredCopilotKitError };
//# sourceMappingURL=errors.d.mts.map