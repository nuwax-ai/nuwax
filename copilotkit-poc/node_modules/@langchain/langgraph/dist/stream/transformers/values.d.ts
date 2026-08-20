import { Namespace, StreamTransformer } from "../types.js";
import { ValuesTransformerProjection } from "./types.js";

//#region src/stream/transformers/values.d.ts
/**
 * Creates a {@link StreamTransformer} that captures `values` channel events
 * into a local {@link StreamChannel}. Only events whose namespace exactly
 * matches {@link path} are recorded; events from child or sibling namespaces
 * are ignored.
 *
 * The final snapshot is resolved by {@link StreamMux.close} directly;
 * this transformer only accumulates intermediate values.
 *
 * @param path - Namespace prefix to match against incoming events.
 * @returns A `StreamTransformer` whose projection contains the internal
 *   `_valuesLog` local channel.
 */
declare function createValuesTransformer(path: Namespace): StreamTransformer<ValuesTransformerProjection>;
//#endregion
export { createValuesTransformer };
//# sourceMappingURL=values.d.ts.map