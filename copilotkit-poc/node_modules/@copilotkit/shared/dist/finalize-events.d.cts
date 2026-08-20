import { BaseEvent } from "@ag-ui/client";

//#region src/finalize-events.d.ts
interface FinalizeRunOptions {
  stopRequested?: boolean;
  interruptionMessage?: string;
}
declare function finalizeRunEvents(events: BaseEvent[], options?: FinalizeRunOptions): BaseEvent[];
//#endregion
export { finalizeRunEvents };
//# sourceMappingURL=finalize-events.d.cts.map