import { copyToClipboard } from "./clipboard.mjs";
import { executeConditions } from "./conditions.mjs";
import { ConsoleColors, ConsoleStyles, logCopilotKitPlatformMessage, logStyled, publicApiKeyRequired, styledConsole } from "./console-styling.mjs";
import { BANNER_ERROR_NAMES, COPILOT_CLOUD_ERROR_NAMES, ConfigurationError, CopilotKitAgentDiscoveryError, CopilotKitApiDiscoveryError, CopilotKitError, CopilotKitErrorCode, CopilotKitLowLevelError, CopilotKitMisuseError, CopilotKitRemoteEndpointDiscoveryError, CopilotKitVersionMismatchError, ERROR_CONFIG, ERROR_NAMES, ErrorVisibility, MissingPublicApiKeyError, ResolvedCopilotKitError, Severity, UpgradeRequiredError, ensureStructuredError, getPossibleVersionMismatch, isStructuredCopilotKitError } from "./errors.mjs";
import { actionParametersToJsonSchema, convertJsonSchemaToZodSchema, getZodParameters, jsonSchemaToActionParameters } from "./json-schema.mjs";
import { RUNTIME_MODE_INTELLIGENCE, RUNTIME_MODE_SSE } from "./types.mjs";
import { dataToUUID, isValidUUID, randomId, randomUUID } from "./random-id.mjs";
import { readBody } from "./requests.mjs";
import * as PartialJSON from "partial-json";

//#region src/utils/index.ts
/**
* Safely parses a JSON string into an object
* @param json The JSON string to parse
* @param fallback Optional fallback value to return if parsing fails. If not provided or set to "unset", returns null
* @returns The parsed JSON object, or the fallback value (or null) if parsing fails
*/
function parseJson(json, fallback = "unset") {
	try {
		return JSON.parse(json);
	} catch (e) {
		return fallback === "unset" ? null : fallback;
	}
}
/**
* Parses a partial/incomplete JSON string, returning as much valid data as possible.
* Falls back to an empty object if parsing fails entirely.
*/
function partialJSONParse(json) {
	try {
		const parsed = PartialJSON.parse(json);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
		return {};
	} catch (error) {
		return {};
	}
}
/**
* Returns an exponential backoff function suitable for Phoenix.js
* `reconnectAfterMs` and `rejoinAfterMs` options.
*
* @param baseMs  - Initial delay for the first retry attempt.
* @param maxMs   - Upper bound — delays are capped at this value.
*
* Phoenix calls the returned function with a 1-based `tries` count.
* The delay doubles on each attempt: baseMs, 2×baseMs, 4×baseMs, …, maxMs.
*/
function phoenixExponentialBackoff(baseMs, maxMs) {
	return (tries) => Math.min(baseMs * 2 ** (tries - 1), maxMs);
}
/**
* Maps an array of items to a new array, skipping items that throw errors during mapping
* @param items The array to map
* @param callback The mapping function to apply to each item
* @returns A new array containing only the successfully mapped items
*/
function tryMap(items, callback) {
	return items.reduce((acc, item, index, array) => {
		try {
			acc.push(callback(item, index, array));
		} catch (error) {
			console.error(error);
		}
		return acc;
	}, []);
}
/**
* Checks if the current environment is macOS
* @returns {boolean} True if running on macOS, false otherwise
*/
function isMacOS() {
	return /Mac|iMac|Macintosh/i.test(navigator.userAgent);
}
/**
* Safely parses a JSON string into a tool arguments object.
* Returns the parsed object only if it's a plain object (not an array, null, etc.).
* Falls back to an empty object for any non-object JSON value or parse failure.
*/
function safeParseToolArgs(raw) {
	try {
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
		console.warn(`[CopilotKit] Tool arguments parsed to non-object (${typeof parsed}), falling back to empty object`);
		return {};
	} catch {
		console.warn("[CopilotKit] Failed to parse tool arguments, falling back to empty object");
		return {};
	}
}

//#endregion
export { isMacOS, parseJson, partialJSONParse, phoenixExponentialBackoff, safeParseToolArgs, tryMap };
//# sourceMappingURL=index.mjs.map