//#region src/transcription-errors.d.ts
/**
 * Error codes for transcription HTTP responses.
 * Uses snake_case to align with existing CopilotKitCoreErrorCode pattern.
 * These codes are returned by the runtime and parsed by the client.
 */
declare enum TranscriptionErrorCode {
  /** Transcription service not configured in runtime */
  SERVICE_NOT_CONFIGURED = "service_not_configured",
  /** Audio format not supported */
  INVALID_AUDIO_FORMAT = "invalid_audio_format",
  /** Audio file is too long */
  AUDIO_TOO_LONG = "audio_too_long",
  /** Audio file is empty or too short */
  AUDIO_TOO_SHORT = "audio_too_short",
  /** Rate limited by transcription provider */
  RATE_LIMITED = "rate_limited",
  /** Authentication failed with transcription provider */
  AUTH_FAILED = "auth_failed",
  /** Transcription provider returned an error */
  PROVIDER_ERROR = "provider_error",
  /** Network error during transcription */
  NETWORK_ERROR = "network_error",
  /** Invalid request format */
  INVALID_REQUEST = "invalid_request"
}
/**
 * Error response format returned by the transcription endpoint.
 */
interface TranscriptionErrorResponse {
  error: TranscriptionErrorCode;
  message: string;
  retryable?: boolean;
}
/**
 * Helper functions to create transcription error responses.
 * Used by the runtime to return consistent error responses.
 */
declare const TranscriptionErrors: {
  serviceNotConfigured: () => TranscriptionErrorResponse;
  invalidAudioFormat: (format: string, supported: string[]) => TranscriptionErrorResponse;
  invalidRequest: (details: string) => TranscriptionErrorResponse;
  rateLimited: () => TranscriptionErrorResponse;
  authFailed: () => TranscriptionErrorResponse;
  providerError: (message: string) => TranscriptionErrorResponse;
  networkError: (message?: string) => TranscriptionErrorResponse;
  audioTooLong: () => TranscriptionErrorResponse;
  audioTooShort: () => TranscriptionErrorResponse;
};
//#endregion
export { TranscriptionErrorCode, TranscriptionErrorResponse, TranscriptionErrors };
//# sourceMappingURL=transcription-errors.d.mts.map