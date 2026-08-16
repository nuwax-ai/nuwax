export type ConnectionRunId = string & {
  readonly __connectionRunId: unique symbol;
};
export type AbortConnection = () => void;

export interface ConnectionRunController {
  startRun(): ConnectionRunId;
  attach(runId: ConnectionRunId, abort: AbortConnection): boolean;
  isCurrent(runId: ConnectionRunId): boolean;
  isSuperseded(runId: ConnectionRunId): boolean;
  complete(runId: ConnectionRunId): boolean;
  abortCurrent(): void;
}

interface ConnectionRunOwnership {
  runId: ConnectionRunId;
  abort?: AbortConnection;
}

/**
 * 管理一个流连接槽位的 run 所有权。
 *
 * 消息类回调用 isCurrent：显式 abort 后也不再消费迟到数据。
 * 收尾类回调用 complete：没有新 run 时保留原有收尾合同；已有新 run 时拒绝旧回调。
 */
export function createConnectionRunController(
  idPrefix = 'connection',
): ConnectionRunController {
  let sequence = 0;
  let current: ConnectionRunOwnership | undefined;

  return {
    startRun() {
      sequence += 1;
      const runId = `${idPrefix}-${sequence}` as ConnectionRunId;
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

    isCurrent(runId) {
      return current?.runId === runId;
    },

    isSuperseded(runId) {
      return Boolean(current && current.runId !== runId);
    },

    complete(runId) {
      if (current && current.runId !== runId) {
        return false;
      }
      if (current?.runId === runId) {
        current = undefined;
      }
      return true;
    },

    abortCurrent() {
      const ownership = current;
      current = undefined;
      ownership?.abort?.();
    },
  };
}
