//#region src/transcription-errors.ts
/**
* Error codes for transcription HTTP responses.
* Uses snake_case to align with existing CopilotKitCoreErrorCode pattern.
* These codes are returned by the runtime and parsed by the client.
*/
let TranscriptionErrorCode = /* @__PURE__ */ function(TranscriptionErrorCode) {
	/** Transcription service not configured in runtime */
	TranscriptionErrorCode["SERVICE_NOT_CONFIGURED"] = "service_not_configured";
	/** Audio format not supported */
	TranscriptionErrorCode["INVALID_AUDIO_FORMAT"] = "invalid_audio_format";
	/** Audio file is too long */
	TranscriptionErrorCode["AUDIO_TOO_LONG"] = "audio_too_long";
	/** Audio file is empty or too short */
	TranscriptionErrorCode["AUDIO_TOO_SHORT"] = "audio_too_short";
	/** Rate limited by transcription provider */
	TranscriptionErrorCode["RATE_LIMITED"] = "rate_limited";
	/** Authentication failed with transcription provider */
	TranscriptionErrorCode["AUTH_FAILED"] = "auth_failed";
	/** Transcription provider returned an error */
	TranscriptionErrorCode["PROVIDER_ERROR"] = "provider_error";
	/** Network error during transcription */
	TranscriptionErrorCode["NETWORK_ERROR"] = "network_error";
	/** Invalid request format */
	TranscriptionErrorCode["INVALID_REQUEST"] = "invalid_request";
	return TranscriptionErrorCode;
}({});
/**
* Helper functions to create transcription error responses.
* Used by the runtime to return consistent error responses.
*/
const TranscriptionErrors = {
	serviceNotConfigured: () => ({
		error: TranscriptionErrorCode.SERVICE_NOT_CONFIGURED,
		message: "Transcription service is not configured",
		retryable: false
	}),
	invalidAudioFormat: (format, supported) => ({
		error: TranscriptionErrorCode.INVALID_AUDIO_FORMAT,
		message: `Unsupported audio format: ${format}. Supported: ${supported.join(", ")}`,
		retryable: false
	}),
	invalidRequest: (details) => ({
		error: TranscriptionErrorCode.INVALID_REQUEST,
		message: details,
		retryable: false
	}),
	rateLimited: () => ({
		error: TranscriptionErrorCode.RATE_LIMITED,
		message: "Rate limited. Please try again later.",
		retryable: true
	}),
	authFailed: () => ({
		error: TranscriptionErrorCode.AUTH_FAILED,
		message: "Authentication failed with transcription provider",
		retryable: false
	}),
	providerError: (message) => ({
		error: TranscriptionErrorCode.PROVIDER_ERROR,
		message,
		retryable: true
	}),
	networkError: (message = "Network error during transcription") => ({
		error: TranscriptionErrorCode.NETWORK_ERROR,
		message,
		retryable: true
	}),
	audioTooLong: () => ({
		error: TranscriptionErrorCode.AUDIO_TOO_LONG,
		message: "Audio file is too long",
		retryable: false
	}),
	audioTooShort: () => ({
		error: TranscriptionErrorCode.AUDIO_TOO_SHORT,
		message: "Audio is too short to transcribe",
		retryable: false
	})
};

//#endregion
export { TranscriptionErrorCode, TranscriptionErrors };
//# sourceMappingURL=transcription-errors.mjs.map