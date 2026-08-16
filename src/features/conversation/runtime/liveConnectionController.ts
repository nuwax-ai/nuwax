export type LiveRunId = string & { readonly __liveRunId: unique symbol };
export type AbortLiveConnection = () => void;

export interface LiveConnectionController {
  startRun(): LiveRunId;
  attach(runId: LiveRunId, abort: AbortLiveConnection): boolean;
  isSuperseded(runId: LiveRunId): boolean;
  abortCurrent(): void;
}

interface LiveConnectionOwnership {
  runId: LiveRunId;
  abort?: AbortLiveConnection;
}

/**
 * 一个会话实例的 live 流所有权 Controller。
 *
 * “stale”严格表示已有另一个当前 run；显式 stop/clear 后 current 为空，旧回调仍执行原有
 * 全局收尾合同。Controller 不依赖 React 或具体 SSE Adapter。
 */
export function createLiveConnectionController(): LiveConnectionController {
  let sequence = 0;
  let current: LiveConnectionOwnership | undefined;

  return {
    startRun() {
      sequence += 1;
      const runId = `live-${sequence}` as LiveRunId;
      current = { runId };
      return runId;
    },

    attach(runId, abort) {
      if (!current || current.runId !== runId) {
        abort();
        return false;
      }
      current.abort = abort;
      return true;
    },

    isSuperseded(runId) {
      return Boolean(current && current.runId !== runId);
    },

    abortCurrent() {
      const ownership = current;
      current = undefined;
      ownership?.abort?.();
    },
  };
}
