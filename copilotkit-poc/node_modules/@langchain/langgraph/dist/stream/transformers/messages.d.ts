import { Namespace, StreamTransformer } from "../types.js";
import { MessagesTransformerProjection } from "./types.js";

//#region src/stream/transformers/messages.d.ts
/**
 * Creates a {@link StreamTransformer} that groups `messages` channel events into
 * per-message {@link ChatModelStream} instances.
 *
 * A new `ChatModelStream` is created on `message-start` and closed on
 * `message-finish`. Content-block events in between are forwarded to the
 * active stream. Only events whose namespace exactly matches {@link path}
 * are processed; child namespaces are ignored.
 *
 * @param path - Namespace prefix to match against incoming events.
 * @param nodeFilter - If provided, only events emitted by this graph node
 *   are processed; all others are skipped.
 * @returns A `StreamTransformer` whose projection contains the `messages`
 *   async iterable.
 */
declare function createMessagesTransformer(path: Namespace, nodeFilter?: string): StreamTransformer<MessagesTransformerProjection>;
//#endregion
export { createMessagesTransformer };
//# sourceMappingURL=messages.d.ts.map