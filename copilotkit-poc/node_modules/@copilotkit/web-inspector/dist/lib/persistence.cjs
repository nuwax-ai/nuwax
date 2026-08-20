
//#region src/lib/persistence.ts
function loadInspectorState(storageKey) {
	if (typeof window === "undefined") return null;
	const raw = window.localStorage.getItem(storageKey);
	if (raw) try {
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object") return parsed;
	} catch {}
	if (typeof document !== "undefined") {
		const prefix = `${storageKey}=`;
		const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
		if (entry) {
			const legacyRaw = entry.substring(prefix.length);
			try {
				const parsed = JSON.parse(decodeURIComponent(legacyRaw));
				if (parsed && typeof parsed === "object") return parsed;
			} catch {
				return null;
			}
		}
	}
	return null;
}
function saveInspectorState(storageKey, state) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(storageKey, JSON.stringify(state));
	} catch (error) {
		console.warn("Failed to persist inspector state", error);
	}
}
function isValidAnchor(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return (candidate.horizontal === "left" || candidate.horizontal === "right") && (candidate.vertical === "top" || candidate.vertical === "bottom");
}
function isValidPosition(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return isFiniteNumber(candidate.x) && isFiniteNumber(candidate.y);
}
function isValidSize(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return isFiniteNumber(candidate.width) && isFiniteNumber(candidate.height);
}
function isFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value);
}
function isValidDockMode(value) {
	return value === "floating" || value === "docked-left";
}
const TELEMETRY_DISTINCT_ID_KEY = "cpk:inspector:telemetry:distinct_id";
const TELEMETRY_OPT_OUT_KEY = "cpk:inspector:telemetry:opt_out";
const TELEMETRY_DISCLOSURE_SHOWN_KEY = "cpk:inspector:telemetry:disclosure_shown";
let inMemoryFallbackId = null;
function getOrCreateTelemetryDistinctId() {
	if (typeof window === "undefined") return generateUuidV4();
	try {
		const existing = window.localStorage.getItem(TELEMETRY_DISTINCT_ID_KEY);
		if (existing && existing.length > 0) return existing;
		const fresh = generateUuidV4();
		window.localStorage.setItem(TELEMETRY_DISTINCT_ID_KEY, fresh);
		return fresh;
	} catch {
		return inMemoryFallbackId ??= generateUuidV4();
	}
}
function isTelemetryOptedOut() {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(TELEMETRY_OPT_OUT_KEY) === "true";
	} catch {
		return false;
	}
}
function hasTelemetryDisclosureBeenShown() {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(TELEMETRY_DISCLOSURE_SHOWN_KEY) === "true";
	} catch {
		return false;
	}
}
function markTelemetryDisclosureShown() {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(TELEMETRY_DISCLOSURE_SHOWN_KEY, "true");
	} catch {}
}
function generateUuidV4() {
	if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = Math.random() * 16 | 0;
		return (c === "x" ? r : r & 3 | 8).toString(16);
	});
}

//#endregion
exports.getOrCreateTelemetryDistinctId = getOrCreateTelemetryDistinctId;
exports.hasTelemetryDisclosureBeenShown = hasTelemetryDisclosureBeenShown;
exports.isTelemetryOptedOut = isTelemetryOptedOut;
exports.isValidAnchor = isValidAnchor;
exports.isValidDockMode = isValidDockMode;
exports.isValidPosition = isValidPosition;
exports.isValidSize = isValidSize;
exports.loadInspectorState = loadInspectorState;
exports.markTelemetryDisclosureShown = markTelemetryDisclosureShown;
exports.saveInspectorState = saveInspectorState;
//# sourceMappingURL=persistence.cjs.map