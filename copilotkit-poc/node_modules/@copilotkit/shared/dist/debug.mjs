//#region src/debug.ts
/** The all-off config used when debug is falsy. */
const DEBUG_OFF = {
	enabled: false,
	events: false,
	lifecycle: false,
	verbose: false
};
/**
* Normalizes a DebugConfig value into a ResolvedDebugConfig.
*
* - `false` / `undefined` → all off
* - `true` → events + lifecycle on, verbose off (no PII in logs)
* - object → merges with defaults (events: true, lifecycle: true, verbose: false)
*/
function resolveDebugConfig(debug) {
	if (!debug) return DEBUG_OFF;
	if (debug === true) return {
		enabled: true,
		events: true,
		lifecycle: true,
		verbose: false
	};
	const events = debug.events ?? true;
	const lifecycle = debug.lifecycle ?? true;
	const enabled = events || lifecycle;
	return {
		enabled,
		events,
		lifecycle,
		verbose: enabled && (debug.verbose ?? false)
	};
}

//#endregion
export { resolveDebugConfig };
//# sourceMappingURL=debug.mjs.map