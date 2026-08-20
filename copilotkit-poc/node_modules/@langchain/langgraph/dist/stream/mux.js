import { INTERRUPT, isInterrupted } from "../constants.js";
import { convertToProtocolEvent } from "./convert.js";
import { StreamChannel, isStreamChannel } from "./stream-channel.js";
//#region src/stream/mux.ts
/** Wire prefix for user-defined {@link StreamChannel} auto-forwards. */
const EXTENSION_CHANNEL_PREFIX = "custom:";
/**
* Protocol method for a user-defined (extension) {@link StreamChannel}.
* Matches Python's `StreamMux._bind_and_wire` (`f"custom:{value.name}"`).
*/
function extensionChannelMethod(channelName) {
	return `${EXTENSION_CHANNEL_PREFIX}${channelName}`;
}
/**
* Structural `PromiseLike<T>` predicate — true for thenables including
* native promises, user-constructed `{ then }` objects, and helper
* wrappers. Used by {@link StreamMux.wireChannels} to detect final-value
* projections distinctly from streaming `StreamChannel` values.
*/
function isPromiseLike(value) {
	return value != null && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
}
/**
* Symbol key used by {@link StreamMux} to resolve the values promise on a
* stream handle. Using a symbol keeps this off the public autocomplete surface.
*/
const RESOLVE_VALUES = Symbol("resolveValues");
/**
* Symbol key used by {@link StreamMux} to reject the values promise on a
* stream handle. Using a symbol keeps this off the public autocomplete surface.
*/
const REJECT_VALUES = Symbol("rejectValues");
/**
* Central event dispatcher that routes {@link ProtocolEvent}s through a
* pipeline of {@link StreamTransformer}s, manages namespace discovery for
* subgraph streams, and exposes async iteration over filtered event
* sequences.
*
* One `StreamMux` instance exists per top-level
* `streamEvents(..., { version: "v3" })` invocation.
*/
var StreamMux = class {
	/** @internal All protocol events in arrival order (after reducer pipeline). */
	_events = StreamChannel.local();
	/** @internal New-namespace discovery notifications. */
	_discoveries = StreamChannel.local();
	/** Monotonic counter for auto-forwarded channel events. */
	#nextEmitSeq = 0;
	/** Whether the mux has been closed or failed. */
	#closed = false;
	/** The error passed to {@link fail}, if any. */
	#error;
	/** Whether the run was interrupted. */
	#interrupted = false;
	/**
	* Namespace of the event currently being processed by
	* {@link push}.  Read by {@link StreamChannel} wiring callbacks so
	* auto-forwarded events inherit the triggering event's namespace.
	*/
	#currentNamespace = [];
	#transformers = [];
	#channels = [];
	#streamMap = /* @__PURE__ */ new Map();
	#latestValues = /* @__PURE__ */ new Map();
	#interrupts = [];
	/**
	* Final-value projection keys tracked for remote surfacing. Populated
	* by {@link wireChannels} when a transformer's projection contains a
	* `PromiseLike` value. Each entry is flushed as a `custom:<name>`
	* protocol event during {@link close} so that remote clients can
	* observe final-value transformers via `thread.extensions.<name>`.
	*/
	#finalValues = [];
	/**
	* Associates a pre-existing stream handle with a namespace so that
	* {@link close} can resolve its values promise later.
	*
	* @param path - The namespace path to register.
	* @param stream - The run stream handle for that namespace.
	*/
	register(path, stream) {
		this.#streamMap.set(nsKey(path), stream);
	}
	/**
	* Registers a transformer and replays all buffered events through it so
	* it catches up with events already processed by the mux.  When the event
	* log is empty (typical at construction time) the replay is a no-op.
	*
	* The transformer must already have been initialised (i.e. `init()` called
	* and any projection wired).  The sequence is:
	*
	*   1. Snapshot the current event log length.
	*   2. Append the transformer so future {@link push} calls reach it.
	*   3. Replay events `[0, snapshot)` through `process()`.
	*   4. If the mux is already closed, call `finalize()` (or `fail()`)
	*      immediately so the transformer's log/channel terminates cleanly.
	*
	* @param transformer - An already-initialised transformer to register.
	*/
	addTransformer(transformer) {
		const snapshot = this._events.size;
		this.#transformers.push(transformer);
		if (transformer.onRegister) transformer.onRegister({ push: (ns, event) => this.push(ns, event) });
		for (let i = 0; i < snapshot; i += 1) transformer.process(this._events.get(i));
		if (this.#closed) if (this.#error !== void 0) transformer.fail?.(this.#error);
		else transformer.finalize?.();
	}
	/**
	* Scans a transformer projection for streaming and final-value primitives.
	* Remote stream channels are wired to auto-forward to the protocol event
	* stream; local stream channels are tracked for lifecycle only.
	*
	* Two projection shapes are recognised:
	*
	*   - {@link StreamChannel} values — named channels forward each `push()`
	*     immediately as a `custom:<channelName>` protocol event. Unnamed
	*     channels remain in-process-only.
	*
	*   - `PromiseLike<unknown>` values — tracked as final-value
	*     projections and flushed on {@link close} as a single
	*     `custom:<key>` event, where `<key>` is the projection key.
	*     This mirrors the in-process `await run.extensions.<key>`
	*     ergonomics on remote clients via
	*     `await thread.extensions.<key>`.
	*
	* Plain values that are neither are ignored — they remain in-process-only,
	* matching prior behaviour.
	*
	* @param projection - The object returned by `transformer.init()`.
	*/
	wireChannels(projection) {
		for (const [key, value] of Object.entries(projection)) {
			if (isStreamChannel(value)) {
				this.#channels.push(value);
				if (typeof value.channelName !== "string") continue;
				const method = extensionChannelMethod(value.channelName);
				value._wire((item) => {
					this._events.push({
						type: "event",
						seq: this.#nextEmitSeq++,
						method,
						params: {
							namespace: this.#currentNamespace,
							timestamp: Date.now(),
							data: item
						}
					});
				});
				continue;
			}
			if (isPromiseLike(value)) this.#finalValues.push({
				name: key,
				promise: Promise.resolve(value)
			});
		}
	}
	/**
	* Distributes an event through the transformer pipeline, then appends it to
	* the main event log.
	*
	* Subgraph discovery (materializing a {@link StreamHandle} for each
	* newly observed top-level namespace) is handled by the
	* {@link createSubgraphDiscoveryTransformer} when installed, not here.
	*
	* @param ns - The namespace path that produced the event.
	* @param event - The protocol event to process and store.
	*/
	push(ns, event) {
		if (event.method === "values") this.#latestValues.set(nsKey(ns), event.params.data);
		const outerNamespace = this.#currentNamespace;
		this.#currentNamespace = ns;
		let keep = true;
		for (const transformer of this.#transformers) if (!transformer.process(event)) keep = false;
		this.#currentNamespace = outerNamespace;
		if (keep) this._events.push({
			...event,
			seq: this.#nextEmitSeq++
		});
	}
	/**
	* Gracefully ends the stream: resolves values promises on all known
	* streams, finalizes every transformer, auto-closes streaming
	* channels, flushes any final-value projections as `custom:<name>`
	* events, and closes both event logs.
	*
	* When final-value projections are present, `_events.close()` is
	* deferred until every tracked projection promise has settled so
	* remote consumers observe the flushed values before their event
	* stream ends. Callers do not need to await — `close()` returns
	* synchronously and any downstream consumer iterating
	* {@link _events} naturally waits for the final events.
	*/
	close() {
		this.#closed = true;
		for (const [key, values] of this.#latestValues.entries()) {
			const ns = key ? key.split("\0") : [];
			this.#streamMap.get(nsKey(ns))?.[RESOLVE_VALUES](values);
		}
		const finalizePromises = [];
		for (const transformer of this.#transformers) {
			const result = transformer.finalize?.();
			if (result != null && typeof result.then === "function") finalizePromises.push(result);
		}
		for (const channel of this.#channels) channel._close();
		const finalValues = this.#finalValues;
		if (finalValues.length === 0 && finalizePromises.length === 0) {
			this._events.close();
			this._discoveries.close();
		} else Promise.allSettled([...finalizePromises, ...finalValues.map(async ({ name, promise }) => {
			try {
				const resolved = await promise;
				if (!this._events.done) this._events.push({
					type: "event",
					seq: this.#nextEmitSeq++,
					method: "custom",
					params: {
						namespace: [],
						timestamp: Date.now(),
						data: {
							name,
							payload: resolved
						}
					}
				});
			} catch {}
		})]).then(() => {
			this._events.close();
			this._discoveries.close();
		});
		for (const stream of this.#streamMap.values()) stream[RESOLVE_VALUES](void 0);
	}
	/**
	* Propagates a failure to all transformers, channels, event logs, and
	* stream handles.
	*
	* @param err - The error that caused the run to fail.
	*/
	fail(err) {
		this.#closed = true;
		this.#error = err;
		for (const transformer of this.#transformers) transformer.fail?.(err);
		for (const channel of this.#channels) channel._fail(err);
		this._events.fail(err);
		this._discoveries.fail(err);
		for (const stream of this.#streamMap.values()) stream[REJECT_VALUES](err);
	}
	/**
	* Records that the run was interrupted, appending the supplied payloads
	* for later retrieval.
	*
	* @param interrupts - The interrupt payloads to store.
	*/
	markInterrupted(interrupts) {
		this.#interrupted = true;
		this.#interrupts.push(...interrupts);
	}
	/**
	* Whether the run ended due to an interrupt.
	*
	* @returns `true` if {@link markInterrupted} was called.
	*/
	get interrupted() {
		return this.#interrupted;
	}
	/**
	* All interrupt payloads collected during the run.
	*
	* @returns A readonly view of the accumulated interrupt payloads.
	*/
	get interrupts() {
		return this.#interrupts;
	}
	/**
	* Returns an async iterator that yields only events whose namespace
	* starts with {@link path}.
	*
	* @param path - Namespace prefix to filter on.
	* @param startAt - Zero-based index into the event log to begin from.
	* @returns An async iterator over matching {@link ProtocolEvent}s.
	*/
	subscribeEvents(path, startAt = 0) {
		const base = this._events.iterate(startAt);
		return { async next() {
			while (true) {
				const result = await base.next();
				if (result.done) return result;
				if (hasPrefix(result.value.params.namespace, path)) return result;
			}
		} };
	}
};
/**
* Background consumer that drains a raw `graph.stream()` source into a
* {@link StreamMux}.  Converts each chunk to a {@link ProtocolEvent} and
* pushes it; calls {@link StreamMux.close} on normal completion or
* {@link StreamMux.fail} on error.
*
* @param source - The async iterable of raw stream chunks from the engine.
* @param mux - The mux instance to feed.
* @returns A promise that resolves when the source is fully consumed.
*/
async function pump(source, mux) {
	let seq = 0;
	try {
		for await (const chunk of source) {
			const [ns, mode, payload] = chunk;
			if (mode === "values" && isInterrupted(payload)) {
				const interrupts = payload[INTERRUPT];
				mux.markInterrupted(interrupts.map((i) => ({
					interruptId: i.id ?? "",
					payload: i.value
				})));
			}
			const events = convertToProtocolEvent({
				namespace: ns,
				mode,
				payload,
				seq
			});
			seq += events.length;
			for (const event of events) mux.push(ns, event);
		}
	} catch (err) {
		mux.fail(err);
		return;
	}
	mux.close();
}
/**
* Serialises a {@link Namespace} array into a single string key using the
* null byte (`\x00`) as separator, suitable for `Map`/`Set` lookups.
*
* @param ns - The namespace segments to join.
* @returns A null-byte-joined string key.
*/
function nsKey(ns) {
	return ns.join("\0");
}
/**
* Tests whether {@link ns} starts with every segment in {@link prefix}.
*
* @param ns - The full namespace to check.
* @param prefix - The prefix to match against.
* @returns `true` if `ns` begins with `prefix` segment-by-segment.
*/
function hasPrefix(ns, prefix) {
	if (prefix.length > ns.length) return false;
	for (let i = 0; i < prefix.length; i += 1) if (ns[i] !== prefix[i]) return false;
	return true;
}
//#endregion
export { REJECT_VALUES, RESOLVE_VALUES, StreamMux, hasPrefix, nsKey, pump };

//# sourceMappingURL=mux.js.map