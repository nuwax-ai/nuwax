import { StreamChannel } from "../stream-channel.js";
import { hasPrefix } from "../mux.js";
//#region src/stream/transformers/values.ts
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
function createValuesTransformer(path) {
	const valuesLog = StreamChannel.local();
	return {
		init: () => ({ _valuesLog: valuesLog }),
		process(event) {
			if (event.method !== "values") return true;
			if (event.params.namespace.length !== path.length) return true;
			if (!hasPrefix(event.params.namespace, path)) return true;
			valuesLog.push(event.params.data);
			return true;
		},
		finalize() {
			valuesLog.close();
		},
		fail(err) {
			valuesLog.fail(err);
		}
	};
}
//#endregion
export { createValuesTransformer };

//# sourceMappingURL=values.js.map