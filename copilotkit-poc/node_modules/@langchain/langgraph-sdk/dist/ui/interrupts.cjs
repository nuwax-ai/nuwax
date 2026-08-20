const require_headless_tools = require("../headless-tools.cjs");
const require_hitl_interrupt_payload = require("./hitl-interrupt-payload.cjs");
//#region src/ui/interrupts.ts
/**
* Normalizes HITL interrupt payloads to expose camelCase fields plus deprecated
* snake_case aliases for compatibility during migration.
*/
function normalizeInterruptForClient(interrupt) {
	if (interrupt.value === void 0) return interrupt;
	return {
		...interrupt,
		value: require_hitl_interrupt_payload.normalizeHitlInterruptPayload(interrupt.value)
	};
}
/**
* Applies {@link normalizeInterruptForClient} to each interrupt.
*/
function normalizeInterruptsList(interrupts) {
	return interrupts.map((i) => normalizeInterruptForClient(i));
}
function userFacingInterruptsFromValuesArray(valueInterrupts) {
	if (valueInterrupts.length === 0) return [{ when: "breakpoint" }];
	const filtered = require_headless_tools.filterOutHeadlessToolInterrupts(valueInterrupts);
	if (filtered.length === 0) return [];
	return normalizeInterruptsList(filtered);
}
function userFacingInterruptsFromThreadTasks(allInterrupts) {
	if (allInterrupts.length === 0) return null;
	const filtered = require_headless_tools.filterOutHeadlessToolInterrupts(allInterrupts);
	if (filtered.length === 0) return [];
	return normalizeInterruptsList(filtered);
}
function extractInterrupts(values, options) {
	if (typeof values === "object" && values != null && "__interrupt__" in values && Array.isArray(values.__interrupt__)) {
		const valueInterrupts = values.__interrupt__;
		if (valueInterrupts.length === 0) return { when: "breakpoint" };
		const filtered = require_headless_tools.filterOutHeadlessToolInterrupts(valueInterrupts);
		if (filtered.length === 0) return void 0;
		if (filtered.length === 1) return normalizeInterruptForClient(filtered[0]);
		return filtered.map((i) => normalizeInterruptForClient(i));
	}
	if (options?.isLoading) return void 0;
	const interrupts = options?.threadState?.tasks?.at(-1)?.interrupts;
	if (interrupts == null || interrupts.length === 0) {
		if (!(options?.threadState?.next ?? []).length || options?.error != null) return void 0;
		return { when: "breakpoint" };
	}
	const filtered = require_headless_tools.filterOutHeadlessToolInterrupts(interrupts);
	if (filtered.length === 0) {
		if (!(options?.threadState?.next ?? []).length || options?.error != null) return void 0;
		return { when: "breakpoint" };
	}
	return normalizeInterruptForClient(filtered.at(-1));
}
//#endregion
exports.extractInterrupts = extractInterrupts;
exports.normalizeInterruptForClient = normalizeInterruptForClient;
exports.normalizeInterruptsList = normalizeInterruptsList;
exports.userFacingInterruptsFromThreadTasks = userFacingInterruptsFromThreadTasks;
exports.userFacingInterruptsFromValuesArray = userFacingInterruptsFromValuesArray;

//# sourceMappingURL=interrupts.cjs.map