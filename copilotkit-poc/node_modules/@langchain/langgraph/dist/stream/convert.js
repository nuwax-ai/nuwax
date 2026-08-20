//#region src/stream/convert.ts
/**
* The set of stream modes requested by
* `streamEvents(..., { version: "v3" })` — every mode the protocol maps
* to a channel.
*
* The verbose `"debug"` mode is intentionally excluded: it was a thin
* re-wrap of `checkpoints` + `tasks` carrying no new information.
*
* The `"checkpoints"` mode is likewise excluded from the stream-mode
* request because the protocol's `checkpoints` channel carries only a
* lightweight envelope (`id`, `parent_id`, `step`, `source`) emitted as a
* separate ``[namespace, "checkpoints", envelope]`` chunk before each paired
* `values` chunk — not the full-state shape from Pregel's `checkpoints`
* stream mode when subscribed via `debug`.
*/
const STREAM_EVENTS_V3_MODES = [
	"values",
	"updates",
	"messages",
	"tools",
	"custom",
	"tasks"
];
/**
* True when `payload` is a lightweight checkpoint envelope (not a full-state
* Pregel `checkpoints` debug payload).
*/
function isCheckpointEnvelope(payload) {
	if (payload == null || typeof payload !== "object") return false;
	const p = payload;
	return typeof p.id === "string" && ("source" in p || typeof p.step === "number") && !("values" in p) && !("config" in p);
}
function unwrapMessagesPayload(payload) {
	if (!Array.isArray(payload) || payload.length !== 2) return { data: payload };
	const [data, metadata] = payload;
	if (metadata == null || typeof metadata !== "object") return { data: payload };
	const record = metadata;
	const node = typeof record.langgraph_node === "string" ? record.langgraph_node : void 0;
	const runId = typeof record.run_id === "string" ? record.run_id : void 0;
	return {
		data: runId != null && data != null && typeof data === "object" ? {
			...data,
			run_id: runId
		} : data,
		node
	};
}
function convertToProtocolEvent({ namespace: ns, mode, payload, seq }) {
	const timestamp = Date.now();
	const base = { type: "event" };
	switch (mode) {
		case "messages": {
			const { data, node } = unwrapMessagesPayload(payload);
			return [{
				...base,
				seq,
				method: "messages",
				params: {
					namespace: ns,
					timestamp,
					...node ? { node } : {},
					data
				}
			}];
		}
		case "tools": return [{
			...base,
			seq,
			method: "tools",
			params: {
				namespace: ns,
				timestamp,
				data: convertToolsPayload(payload)
			}
		}];
		case "checkpoints":
			if (!isCheckpointEnvelope(payload)) return [];
			return [{
				...base,
				seq,
				method: "checkpoints",
				params: {
					namespace: ns,
					timestamp,
					data: payload
				}
			}];
		case "values": return [{
			...base,
			seq,
			method: "values",
			params: {
				namespace: ns,
				timestamp,
				data: payload
			}
		}];
		case "updates": {
			const data = convertUpdatesPayload(payload);
			return [{
				...base,
				seq,
				method: "updates",
				params: {
					namespace: ns,
					timestamp,
					...typeof data.node === "string" ? { node: data.node } : {},
					data
				}
			}];
		}
		case "custom": {
			const data = typeof payload === "object" && payload !== null && !Array.isArray(payload) && "name" in payload ? payload : { payload };
			return [{
				...base,
				seq,
				method: "custom",
				params: {
					namespace: ns,
					timestamp,
					data
				}
			}];
		}
		case "tasks": return [{
			...base,
			seq,
			method: "tasks",
			params: {
				namespace: ns,
				timestamp,
				data: payload
			}
		}];
		default: return [];
	}
}
/**
* Normalises a raw tools-mode payload into a typed {@link ToolsEventData}
* discriminated union, mapping internal lifecycle events (`on_tool_start`,
* `on_tool_end`, etc.) to their protocol counterparts.
*
* @param payload - The raw payload from a `"tools"` stream chunk.
* @returns A {@link ToolsEventData} object with the appropriate `event`
*   discriminant and associated fields.
*/
function convertToolsPayload(payload) {
	if (typeof payload !== "object" || payload === null) return {
		event: "tool-error",
		tool_call_id: "",
		message: "Unexpected tools payload shape"
	};
	const p = payload;
	const tool_call_id = String(p.toolCallId ?? "");
	switch (p.event) {
		case "on_tool_start": return {
			event: "tool-started",
			tool_call_id,
			tool_name: String(p.name ?? "unknown"),
			input: p.input
		};
		case "on_tool_event": return {
			event: "tool-output-delta",
			tool_call_id,
			delta: typeof p.data === "string" ? p.data : JSON.stringify(p.data ?? "")
		};
		case "on_tool_end": return {
			event: "tool-finished",
			tool_call_id,
			output: p.output
		};
		case "on_tool_error": {
			const err = p.error;
			return {
				event: "tool-error",
				tool_call_id,
				message: typeof err === "object" && err !== null && "message" in err && typeof err.message === "string" ? err.message : String(err ?? "unknown error")
			};
		}
		default: return {
			event: "tool-error",
			tool_call_id: "",
			message: `Unknown tool event: ${String(p.event)}`
		};
	}
}
/**
* Extracts the first `{node: delta}` entry from an updates-mode payload and
* reshapes it into an {@link UpdatesEventData} with explicit `node` and
* `values` fields.  Non-object payloads are coerced to `{ values: {} }`.
*
* @param payload - The raw payload from an `"updates"` stream chunk,
*   expected to be a `Record<string, unknown>` keyed by node name.
* @returns An {@link UpdatesEventData} containing the extracted node name
*   and its associated delta values.
*/
function convertUpdatesPayload(payload) {
	if (typeof payload !== "object" || payload === null) return { values: {} };
	const entries = Object.entries(payload);
	if (entries.length === 0) return { values: {} };
	const [node, values] = entries[0];
	return {
		node,
		values: typeof values === "object" && values !== null ? values : { value: values }
	};
}
//#endregion
export { STREAM_EVENTS_V3_MODES, convertToProtocolEvent, isCheckpointEnvelope };

//# sourceMappingURL=convert.js.map