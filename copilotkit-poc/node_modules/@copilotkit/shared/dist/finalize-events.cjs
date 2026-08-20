const require_runtime = require('./_virtual/_rolldown/runtime.cjs');
const require_random_id = require('./utils/random-id.cjs');
let _ag_ui_client = require("@ag-ui/client");

//#region src/finalize-events.ts
const defaultStopMessage = "Run stopped by user";
const defaultAbruptEndMessage = "Run ended without emitting a terminal event";
function finalizeRunEvents(events, options = {}) {
	const { stopRequested = false, interruptionMessage } = options;
	const resolvedStopMessage = interruptionMessage ?? defaultStopMessage;
	const resolvedAbruptMessage = interruptionMessage && interruptionMessage !== defaultStopMessage ? interruptionMessage : defaultAbruptEndMessage;
	const appended = [];
	const openMessageIds = /* @__PURE__ */ new Set();
	const openToolCalls = /* @__PURE__ */ new Map();
	for (const event of events) switch (event.type) {
		case _ag_ui_client.EventType.TEXT_MESSAGE_START: {
			const messageId = event.messageId;
			if (typeof messageId === "string") openMessageIds.add(messageId);
			break;
		}
		case _ag_ui_client.EventType.TEXT_MESSAGE_END: {
			const messageId = event.messageId;
			if (typeof messageId === "string") openMessageIds.delete(messageId);
			break;
		}
		case _ag_ui_client.EventType.TOOL_CALL_START: {
			const toolCallId = event.toolCallId;
			if (typeof toolCallId === "string") openToolCalls.set(toolCallId, {
				hasEnd: false,
				hasResult: false
			});
			break;
		}
		case _ag_ui_client.EventType.TOOL_CALL_END: {
			const toolCallId = event.toolCallId;
			const info = toolCallId ? openToolCalls.get(toolCallId) : void 0;
			if (info) info.hasEnd = true;
			break;
		}
		case _ag_ui_client.EventType.TOOL_CALL_RESULT: {
			const toolCallId = event.toolCallId;
			const info = toolCallId ? openToolCalls.get(toolCallId) : void 0;
			if (info) info.hasResult = true;
			break;
		}
		default: break;
	}
	const hasRunFinished = events.some((event) => event.type === _ag_ui_client.EventType.RUN_FINISHED);
	const hasRunError = events.some((event) => event.type === _ag_ui_client.EventType.RUN_ERROR);
	const terminalEventMissing = !(hasRunFinished || hasRunError);
	for (const messageId of openMessageIds) {
		const endEvent = {
			type: _ag_ui_client.EventType.TEXT_MESSAGE_END,
			messageId
		};
		events.push(endEvent);
		appended.push(endEvent);
	}
	for (const [toolCallId, info] of openToolCalls) {
		if (!info.hasEnd) {
			const endEvent = {
				type: _ag_ui_client.EventType.TOOL_CALL_END,
				toolCallId
			};
			events.push(endEvent);
			appended.push(endEvent);
		}
		if (terminalEventMissing && !info.hasResult) {
			const resultEvent = {
				type: _ag_ui_client.EventType.TOOL_CALL_RESULT,
				toolCallId,
				messageId: `${toolCallId ?? require_random_id.randomUUID()}-result`,
				role: "tool",
				content: JSON.stringify(stopRequested ? {
					status: "stopped",
					reason: "stop_requested",
					message: resolvedStopMessage
				} : {
					status: "error",
					reason: "missing_terminal_event",
					message: resolvedAbruptMessage
				})
			};
			events.push(resultEvent);
			appended.push(resultEvent);
		}
	}
	if (terminalEventMissing) if (stopRequested) {
		const finishedEvent = { type: _ag_ui_client.EventType.RUN_FINISHED };
		events.push(finishedEvent);
		appended.push(finishedEvent);
	} else {
		const errorEvent = {
			type: _ag_ui_client.EventType.RUN_ERROR,
			message: resolvedAbruptMessage,
			code: "INCOMPLETE_STREAM"
		};
		events.push(errorEvent);
		appended.push(errorEvent);
	}
	return appended;
}

//#endregion
exports.finalizeRunEvents = finalizeRunEvents;
//# sourceMappingURL=finalize-events.cjs.map