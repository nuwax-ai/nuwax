import { Namespace, ProtocolEvent } from "./types.js";
import { StreamMode } from "../pregel/types.js";

//#region src/stream/convert.d.ts
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
declare const STREAM_EVENTS_V3_MODES: StreamMode[];
/**
 * True when `payload` is a lightweight checkpoint envelope (not a full-state
 * Pregel `checkpoints` debug payload).
 */
declare function isCheckpointEnvelope(payload: unknown): boolean;
interface ConvertToProtocolEventOptions {
  namespace: Namespace;
  mode: StreamMode;
  payload: unknown;
  seq: number;
}
declare function convertToProtocolEvent({
  namespace: ns,
  mode,
  payload,
  seq
}: ConvertToProtocolEventOptions): ProtocolEvent[];
//#endregion
export { ConvertToProtocolEventOptions, STREAM_EVENTS_V3_MODES, convertToProtocolEvent, isCheckpointEnvelope };
//# sourceMappingURL=convert.d.ts.map