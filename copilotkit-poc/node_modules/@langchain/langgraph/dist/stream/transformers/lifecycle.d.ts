import { Namespace, NativeStreamTransformer } from "../types.js";
import { StreamChannel } from "../stream-channel.js";
import { LifecycleEntry, LifecycleTransformerOptions } from "./types.js";

//#region src/stream/transformers/lifecycle.d.ts
/**
 * Projection returned from the lifecycle transformer's `init()`.
 *
 * The local `StreamChannel` is closed automatically when the transformer
 * finalizes or fails. `_lifecycleLog` is intentionally underscore-prefixed to
 * signal that it is consumed by the run stream wiring
 * (see `run-stream.ts`) and not meant for direct user access -
 * consumers should read `run.lifecycle` instead.
 *
 * The `lifecycle` iterable is the root-scoped projection (prefix
 * `[]`, starting at offset `0`) mirroring the pattern used by the
 * subgraph discovery transformer.  Root stream wiring consumes it
 * via `SET_LIFECYCLE_ITERABLE`; child streams are wired with their
 * own path-scoped iterable produced by `filterLifecycleEntries`.
 */
interface LifecycleProjection {
  _lifecycleLog: StreamChannel<LifecycleEntry>;
  lifecycle: AsyncIterable<LifecycleEntry>;
}
/**
 * Filter a lifecycle {@link StreamChannel} to only the entries whose
 * namespace lies within the subtree rooted at {@link path}.
 *
 * Returns an `AsyncIterable` whose iterator yields every entry whose
 * namespace either equals {@link path} or is a descendant of it.
 * Iteration begins at {@link startAt}, so callers can capture the
 * log's current size at construction time to skip entries emitted
 * before the caller existed (e.g. a subgraph stream discovered
 * mid-run shouldn't replay the root's `started`).
 *
 * @param log - The shared lifecycle log owned by the transformer.
 * @param path - Namespace prefix to scope entries by (use `[]` for
 *   the root subtree, i.e. everything).
 * @param startAt - Zero-based index into the log to begin from.
 * @returns An async iterable of matching lifecycle entries.
 */
declare function filterLifecycleEntries(log: StreamChannel<LifecycleEntry>, path: Namespace, startAt?: number): AsyncIterable<LifecycleEntry>;
/**
 * Create the built-in lifecycle transformer.
 *
 * Marked as a {@link NativeStreamTransformer} so the run stream
 * factory can expose `_lifecycleLog` via a dedicated getter
 * (`run.lifecycle`) rather than through `run.extensions`.
 */
declare function createLifecycleTransformer(options?: LifecycleTransformerOptions): NativeStreamTransformer<LifecycleProjection>;
//#endregion
export { LifecycleProjection, createLifecycleTransformer, filterLifecycleEntries };
//# sourceMappingURL=lifecycle.d.ts.map