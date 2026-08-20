import { BaseEvent } from "@ag-ui/client";

//#region src/debug-event-envelope.d.ts
interface DebugEventEnvelope {
  timestamp: number;
  agentId: string;
  threadId: string;
  runId: string;
  event: BaseEvent;
}
//#endregion
export { DebugEventEnvelope };
//# sourceMappingURL=debug-event-envelope.d.mts.map