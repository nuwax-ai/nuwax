import { ChatModelStreamHandle, InferExtensions, InterruptPayload, Namespace, ProtocolEvent, StreamTransformer } from "./types.js";
import { StreamChunk } from "../pregel/stream.js";
import { StreamChannel } from "./stream-channel.js";
import { REJECT_VALUES, RESOLVE_VALUES, StreamMux } from "./mux.js";
import { LifecycleEntry } from "./transformers/types.js";
//#region src/stream/run-stream.d.ts
/**
 * Symbol key for attaching the values log to a stream handle.
 * Using a symbol keeps this off the public autocomplete surface.
 */
declare const SET_VALUES_LOG: unique symbol;
/**
 * Symbol key for attaching the messages iterable to a stream handle.
 * Using a symbol keeps this off the public autocomplete surface.
 */
declare const SET_MESSAGES_ITERABLE: unique symbol;
/**
 * Symbol key for attaching the lifecycle iterable to a stream handle.
 * Using a symbol keeps this off the public autocomplete surface.
 */
declare const SET_LIFECYCLE_ITERABLE: unique symbol;
/**
 * Symbol key for attaching the subgraphs iterable to a stream handle.
 * Using a symbol keeps this off the public autocomplete surface.
 */
declare const SET_SUBGRAPHS_ITERABLE: unique symbol;
/**
 * Primary run stream for a LangGraph execution.
 *
 * Implements {@link AsyncIterable} over {@link ProtocolEvent} and exposes
 * ergonomic projections for values, messages, subgraphs, output, and
 * interrupts. Created by {@link createGraphRunStream}.
 *
 * @typeParam TValues - Shape of the graph's state values.
 * @typeParam TExtensions - Shape of additional transformer projections merged
 *   into {@link GraphRunStream.extensions}.
 */
declare class GraphRunStream<TValues = Record<string, unknown>, TExtensions extends Record<string, unknown> = Record<string, unknown>> implements AsyncIterable<ProtocolEvent> {
  #private;
  /**
   * Namespace path identifying this stream's position in the agent tree.
   * An empty array for the root stream.
   */
  readonly path: Namespace;
  /**
   * Merged projections from user-supplied {@link StreamTransformer} factories.
   * Each transformer's `init()` return value is spread into this object.
   */
  readonly extensions: TExtensions;
  /**
   * The central stream multiplexer that drives event dispatch and transformer
   * pipelines. Accessible to subclasses for direct event subscription.
   *
   * @internal
   */
  protected readonly _mux: StreamMux;
  /**
   * @param path - Namespace path for this stream (empty array for root).
   * @param mux - The {@link StreamMux} driving this run.
   * @param discoveryStart - Cursor offset into the mux discovery log.
   * @param eventStart - Cursor offset into the mux event log.
   * @param extensions - Pre-initialized transformer projections.
   * @param abortController - Controller for programmatic cancellation.
   */
  constructor(path: Namespace, mux: StreamMux, discoveryStart?: number, eventStart?: number, extensions?: TExtensions, abortController?: AbortController);
  /**
   * Async iterator over all {@link ProtocolEvent}s at or below this
   * stream's namespace, starting from the configured event offset.
   *
   * @returns An async iterator yielding protocol events in arrival order.
   */
  [Symbol.asyncIterator](): AsyncIterator<ProtocolEvent>;
  /**
   * Async iterable of child {@link SubgraphRunStream} instances discovered
   * during the run. Each yielded stream represents a direct child namespace.
   *
   * Backed by the shared `_discoveries` log on the mux, populated by
   * {@link createSubgraphDiscoveryTransformer}.  For streams created
   * through {@link createGraphRunStream} the iterable is pre-wired
   * (via {@link SET_SUBGRAPHS_ITERABLE}) so iteration is cheap.
   * Streams constructed directly (e.g. in unit tests) fall back to
   * filtering `_mux._discoveries` on demand, preserving the original
   * behavior without requiring explicit wiring.
   *
   * @returns An async iterable of subgraph run streams.
   */
  get subgraphs(): AsyncIterable<SubgraphRunStream>;
  /**
   * Dual-interface accessor for graph state snapshots.
   *
   * As an {@link AsyncIterable}, yields each intermediate state snapshot
   * as it arrives. As a {@link PromiseLike}, resolves with the final
   * state value when the run completes.
   *
   * @returns A combined async iterable and promise-like for state values.
   */
  get values(): AsyncIterable<TValues> & PromiseLike<TValues>;
  /**
   * All AI message lifecycles observed at this namespace level, in order.
   * Each yielded {@link ChatModelStream} represents one message-start →
   * message-finish lifecycle with streaming `.text`, `.reasoning`, and
   * `.usage` projections.
   *
   * @returns An async iterable of chat model streams.
   */
  get messages(): AsyncIterable<ChatModelStreamHandle>;
  /**
   * Sequence of {@link LifecycleEntry} records tracking the
   * `lifecycle` channel: when the run starts, when each subgraph
   * enters/exits, and the terminal status of the run as a whole.
   *
   * Backed by the built-in {@link createLifecycleTransformer}; the
   * root stream's iterable is wired during
   * {@link createGraphRunStream} setup, and each
   * {@link SubgraphRunStream} is wired in the subgraph discovery
   * factory with a subtree-scoped view (via
   * {@link filterLifecycleEntries}).  Streams constructed outside
   * `createGraphRunStream` and not wired will yield nothing.
   *
   * @returns An async iterable of lifecycle entries in emission order.
   */
  get lifecycle(): AsyncIterable<LifecycleEntry>;
  /**
   * Messages produced by a specific graph node. Use when the run has
   * multiple model-calling nodes and you only want messages from one.
   *
   * @param node - The graph node name to filter messages by.
   * @returns An async iterable of chat model streams from the given node.
   */
  messagesFrom(node: string): AsyncIterable<ChatModelStreamHandle>;
  /**
   * Promise that resolves with the final graph state when the run completes,
   * or rejects if the run fails.
   *
   * @returns A promise resolving to the final state values.
   */
  get output(): Promise<TValues>;
  /**
   * Whether the run ended due to a human-in-the-loop interrupt.
   *
   * @returns `true` if the run was interrupted.
   */
  get interrupted(): boolean;
  /**
   * Interrupt payloads collected during the run, if any.
   *
   * @returns A readonly array of interrupt payloads.
   */
  get interrupts(): readonly InterruptPayload[];
  /**
   * Programmatically abort this run. Equivalent to calling
   * `signal.abort(reason)`.
   *
   * @param reason - Optional abort reason passed to the signal.
   */
  abort(reason?: unknown): void;
  /**
   * The {@link AbortSignal} wired into this run for cancellation support.
   *
   * @returns The abort signal for this stream.
   */
  get signal(): AbortSignal;
  /**
   * Resolve the output/values promise with the final state snapshot.
   * Called by {@link StreamMux.close}.
   *
   * @param values - The final state values, or `undefined` if none.
   * @internal
   */
  [RESOLVE_VALUES](values: TValues | undefined): void;
  /**
   * Reject the output/values promise with a run error.
   * Called by {@link StreamMux.fail}.
   *
   * @param err - The error that caused the run to fail.
   * @internal
   */
  [REJECT_VALUES](err: unknown): void;
  /**
   * Attach the transformer-populated event log backing the `.values` iterable.
   * Called during stream setup in {@link createGraphRunStream}.
   *
   * @param log - The event log from the values transformer projection.
   * @internal
   */
  [SET_VALUES_LOG](log: StreamChannel<Record<string, unknown>>): void;
  /**
   * Attach the transformer-populated async iterable backing the `.messages`
   * accessor. Called during stream setup in {@link createGraphRunStream}.
   *
   * @param iterable - The async iterable from the messages transformer projection.
   * @internal
   */
  [SET_MESSAGES_ITERABLE](iterable: AsyncIterable<ChatModelStreamHandle>): void;
  /**
   * Attach the transformer-populated async iterable backing the
   * `.lifecycle` accessor. Called during stream setup in
   * {@link createGraphRunStream}.
   *
   * @param iterable - The async iterable from the lifecycle transformer projection.
   * @internal
   */
  [SET_LIFECYCLE_ITERABLE](iterable: AsyncIterable<LifecycleEntry>): void;
  /**
   * Attach the transformer-populated async iterable backing the
   * `.subgraphs` accessor. Called during root stream setup in
   * {@link createGraphRunStream} and during child stream
   * construction in the discovery transformer factory.
   *
   * @param iterable - The async iterable of direct-child stream handles.
   * @internal
   */
  [SET_SUBGRAPHS_ITERABLE](iterable: AsyncIterable<SubgraphRunStream>): void;
}
/**
 * A run stream for a child subgraph within a parent graph execution.
 *
 * Extends {@link GraphRunStream} with a parsed {@link name} and
 * {@link index} extracted from the last segment of the namespace path.
 * The segment is expected to follow the `"name:index"` convention;
 * when no numeric suffix is present, {@link index} defaults to `0`.
 *
 * @typeParam TValues - Shape of the subgraph's state values.
 * @typeParam TExtensions - Shape of additional transformer projections.
 */
declare class SubgraphRunStream<TValues = Record<string, unknown>, TExtensions extends Record<string, unknown> = Record<string, unknown>> extends GraphRunStream<TValues, TExtensions> {
  /**
   * The node name extracted from the last segment of the namespace path
   * (everything before the final colon, or the full segment if no colon).
   */
  readonly name: string;
  /**
   * The invocation index parsed from the `"name:N"` suffix of the last
   * namespace segment. Defaults to `0` when no numeric suffix is present.
   */
  readonly index: number;
  /**
   * @param path - Namespace path for this subgraph stream.
   * @param mux - The {@link StreamMux} driving this run.
   * @param discoveryStart - Cursor offset into the mux discovery log.
   * @param eventStart - Cursor offset into the mux event log.
   * @param extensions - Pre-initialized transformer projections.
   * @param abortController - Controller for programmatic cancellation.
   */
  constructor(path: Namespace, mux: StreamMux, discoveryStart?: number, eventStart?: number, extensions?: TExtensions, abortController?: AbortController);
}
/**
 * Options accepted by {@link createGraphRunStream}.
 */
interface CreateGraphRunStreamOptions {
  /**
   * Optional abort controller shared with the outer run; if omitted, a
   * fresh controller is allocated for the returned stream.
   */
  abortController?: AbortController;
}
/**
 * Creates a {@link GraphRunStream} with built-in transformers and kicks off the
 * background pump that feeds raw stream chunks through the transformer pipeline.
 *
 * Built-in transformers are registered in this order:
 *   1. subgraph discovery — materializes SubgraphRunStream handles
 *      for each newly observed top-level namespace and announces them
 *      on the mux `_discoveries` log.
 *   2. lifecycle — synthesizes `lifecycle` channel events.
 *   3. values — powers `run.values` / `run.output`.
 *   4. messages — powers `run.messages` / `.messagesFrom`.
 *
 * Subgraph discovery is registered first so that downstream
 * transformers (notably lifecycle) observe child namespaces with
 * their stream handles already in place.  User-supplied transformer
 * factories are registered afterwards.
 *
 * @typeParam TValues - Shape of the graph's state values.
 * @param source - Raw async iterable from `graph.stream(…, { subgraphs: true })`.
 * @param transformers - User-supplied transformer factories.
 * @param optionsOrAbortController - Either a full
 *   {@link CreateGraphRunStreamOptions} object or (for backward
 *   compatibility) a bare `AbortController`.
 * @returns A {@link GraphRunStream} for the root namespace.
 */
declare function createGraphRunStream<TValues = Record<string, unknown>, const TTransformers extends ReadonlyArray<() => StreamTransformer<any>> = []>(source: AsyncIterable<StreamChunk>, transformers?: TTransformers, optionsOrAbortController?: CreateGraphRunStreamOptions | AbortController): GraphRunStream<TValues, InferExtensions<TTransformers>>;
//#endregion
export { CreateGraphRunStreamOptions, GraphRunStream, SET_LIFECYCLE_ITERABLE, SET_MESSAGES_ITERABLE, SET_VALUES_LOG, SubgraphRunStream, createGraphRunStream };
//# sourceMappingURL=run-stream.d.ts.map