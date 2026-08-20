//#region src/types/error.d.ts
interface CopilotErrorEvent {
  type: "error" | "request" | "response" | "agent_state" | "action" | "message" | "performance";
  timestamp: number;
  context: CopilotRequestContext;
  error?: any;
}
interface CopilotRequestContext {
  threadId?: string;
  runId?: string;
  source: "runtime" | "ui" | "agent" | "network";
  request?: {
    operation: string;
    method?: string;
    url?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: any;
    startTime: number;
  };
  response?: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
    endTime: number;
    latency: number;
  };
  agent?: {
    name?: string;
    nodeName?: string;
    state?: any;
  };
  messages?: {
    input?: any[];
    output?: any[];
    messageCount?: number;
  };
  technical?: {
    userAgent?: string;
    host?: string;
    environment?: string;
    version?: string;
    stackTrace?: string;
  };
  performance?: {
    requestDuration?: number;
    streamingDuration?: number;
    actionExecutionTime?: number;
    memoryUsage?: number;
  };
  metadata?: Record<string, any>;
}
type CopilotErrorHandler = (errorEvent: CopilotErrorEvent) => void | Promise<void>;
//#endregion
export { CopilotErrorEvent, CopilotErrorHandler, CopilotRequestContext };
//# sourceMappingURL=error.d.mts.map