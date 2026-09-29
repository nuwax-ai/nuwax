/**
 * 商业宿主的本机服务状态提示。候选电脑始终由 select/list 接口决定，
 * ready 只通知选择器补拉；快照用于覆盖宿主事件先于组件挂载的时序。
 */
export interface ComputerServiceState {
  phase: string;
  sandboxId?: string;
}

type Listener = (state: ComputerServiceState) => void;

let snapshot: ComputerServiceState | null = null;
const listeners = new Set<Listener>();

/** 集中 hostBridgeEvents 的分发入口；重复状态不重复通知、延长等待预算。 */
export function handleComputerServiceStatePayload(payload: {
  phase?: unknown;
  sandboxId?: unknown;
}): void {
  if (typeof payload.phase !== 'string' || !payload.phase.trim()) return;
  const next: ComputerServiceState = {
    phase: payload.phase,
    ...(typeof payload.sandboxId === 'string' && payload.sandboxId.trim()
      ? { sandboxId: payload.sandboxId }
      : {}),
  };
  if (
    snapshot?.phase === next.phase &&
    snapshot?.sandboxId === next.sandboxId
  ) {
    return;
  }
  snapshot = next;
  listeners.forEach((listener) => listener(next));
}

export function getComputerServiceState(): ComputerServiceState | null {
  return snapshot;
}

/** 订阅不立即回调；挂载时读取快照，避免与首次请求叠加。 */
export function subscribeComputerServiceState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetForTest(): void {
  snapshot = null;
  listeners.clear();
}
