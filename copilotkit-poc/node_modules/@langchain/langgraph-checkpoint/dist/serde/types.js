//#region src/serde/types.ts
const TASKS = "__pregel_tasks";
const ERROR = "__error__";
const SCHEDULED = "__scheduled__";
const INTERRUPT = "__interrupt__";
const RESUME = "__resume__";
/**
* Snapshot blob for a `DeltaChannel` with finite snapshot frequency.
*
* Stored directly in a checkpoint's `channel_values` in place of the full
* accumulated value. The ancestor walk in
* {@link BaseCheckpointSaver.getDeltaChannelHistory} terminates when it
* encounters a populated `channel_values` entry for a channel; a
* `DeltaSnapshot` value is the materialized state at that ancestor, so the
* channel reconstructs directly from `.value` without replaying earlier
* writes.
*
* @remarks Beta. The on-disk representation may change in future releases.
*/
var DeltaSnapshot = class {
	/** Marker used for structural detection across module/realm boundaries. */
	lg_name = "DeltaSnapshot";
	value;
	constructor(value) {
		this.value = value;
	}
};
/**
* Structural type guard for {@link DeltaSnapshot}. Uses the `lg_name` marker
* so it survives serialization round-trips and cross-package duplication.
*/
function isDeltaSnapshot(value) {
	return value != null && typeof value === "object" && value.lg_name === "DeltaSnapshot";
}
//#endregion
export { DeltaSnapshot, ERROR, INTERRUPT, RESUME, SCHEDULED, TASKS, isDeltaSnapshot };

//# sourceMappingURL=types.js.map