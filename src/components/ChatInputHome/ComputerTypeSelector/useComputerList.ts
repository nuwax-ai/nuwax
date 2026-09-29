import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  getComputerServiceState,
  subscribeComputerServiceState,
  type ComputerServiceState,
} from '@/services/computerServiceState';
import {
  getHostVisibility,
  subscribeHostVisibility,
} from '@/services/hostVisibility';
import { apiGetUserSelectableSandboxList } from '@/services/systemManage';
import { hostBridge } from '@/utils/hostBridge';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComputerOption } from './types';

const RETRY_INTERVAL_MS = 2_000;
const WAIT_WINDOW_MS = 30_000;

/** 请求与启动等待独立于选择决策，刷新不清空已有列表。 */
export function useComputerList(waitForLocalComputer = true) {
  const [rawComputerList, setRawComputerList] = useState<ComputerOption[]>([]);
  const [agentSelectedMap, setAgentSelectedMap] = useState<
    Record<string, string>
  >({});
  const [initialized, setInitialized] = useState(false);
  const refreshRef = useRef<(() => void) | null>(null);
  const refresh = useCallback(() => refreshRef.current?.(), []);

  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    let queued = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let latestOptions: ComputerOption[] = [];
    // ready/停止各建立新的等待代次；只有此后实际发起请求的成功响应能结束等待。
    let waitGeneration = 0;
    let responseGeneration = -1;
    // 上线等本机出现、停止等本机下线；stopped 通知不携带沙箱 ID，须沿用最后一个已知 ID。
    let waitMode: 'online' | 'offline' | null = null;
    const serviceState = getComputerServiceState();
    let localSandboxId = serviceState?.sandboxId;
    const product = hostBridge.host.getProduct();
    const commercial =
      waitForLocalComputer && (product === 'nuwax' || product === 'nuwawork');
    // 截止时间按墙钟计算：后台暂停不会重置或延长预算。
    let deadline = commercial ? Date.now() + WAIT_WINDOW_MS : 0;
    if (commercial) waitMode = 'online';
    const isVisible = () =>
      getHostVisibility() && document.visibilityState !== 'hidden';
    let visible = isVisible();

    const clearTimer = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const localListed = () =>
      !!localSandboxId &&
      latestOptions.some((option) => String(option.id) === localSandboxId);
    const waitSatisfied = () =>
      responseGeneration === waitGeneration &&
      !!localSandboxId &&
      (waitMode === 'offline' ? !localListed() : localListed());
    const waiting = () =>
      commercial && deadline > Date.now() && !waitSatisfied();

    const scheduleRetry = () => {
      clearTimer();
      if (disposed || !visible || !waiting()) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (waiting()) requestRefresh();
      }, Math.min(RETRY_INTERVAL_MS, deadline - Date.now()));
    };

    const requestRefresh = async () => {
      if (disposed) return;
      clearTimer();
      if (!visible || inFlight) {
        // 事件/展开发生在请求途中时至少补一次新请求，读取事件之后的后台状态。
        queued = true;
        return;
      }
      inFlight = true;
      queued = false;
      const requestGeneration = waitGeneration;
      try {
        const res = await apiGetUserSelectableSandboxList();
        if (disposed) return;
        if (res.code === SUCCESS_CODE && res.data) {
          latestOptions = res.data.sandboxes.map((item) => ({
            id: String(item.sandboxId),
            name: item.name,
            description: item.description,
            raw: item,
          }));
          responseGeneration = requestGeneration;
          setRawComputerList(latestOptions);
          setAgentSelectedMap(res.data.agentSelected ?? {});
          setInitialized(true);
          if (waitSatisfied()) deadline = 0;
        }
      } catch (error) {
        if (!disposed) console.error('Failed to get computer list:', error);
      } finally {
        if (!disposed) {
          inFlight = false;
          if (queued && visible) void requestRefresh();
          else scheduleRetry();
        }
      }
    };

    const handleServiceState = (next: ComputerServiceState) => {
      if (next.sandboxId) localSandboxId = next.sandboxId;
      if (!commercial) return;
      if (next.phase === 'ready') {
        // 重启前的旧列表可能仍含本机，须以 ready 之后的接口响应判断是否在线。
        waitMode = 'online';
        waitGeneration += 1;
        deadline = Date.now() + WAIT_WINDOW_MS;
        void requestRefresh();
      } else if (next.phase === 'stopping') {
        // 上线等待作废；停止瞬间后端仍是旧态，此刻补拉无意义。
        waitMode = null;
        deadline = 0;
        clearTimer();
      } else if (next.phase === 'stopped') {
        // 后端下线有延迟：有界等本机从接口消失，期间其他在线电脑照常展示。
        waitMode = 'offline';
        waitGeneration += 1;
        deadline = Date.now() + WAIT_WINDOW_MS;
        void requestRefresh();
      } else if (next.phase === 'starting' && waitMode === 'offline') {
        // 服务重启则下线等待作废，由后续 ready 重新建立上线等待。
        waitMode = null;
        deadline = 0;
        clearTimer();
      }
    };
    const synchronizeVisibility = () => {
      const next = isVisible();
      if (next === visible) return;
      visible = next;
      if (visible) void requestRefresh();
      else clearTimer();
    };

    refreshRef.current = () => void requestRefresh();
    const unsubscribeService =
      subscribeComputerServiceState(handleServiceState);
    const unsubscribeVisibility = subscribeHostVisibility(
      synchronizeVisibility,
    );
    document.addEventListener('visibilitychange', synchronizeVisibility);
    void requestRefresh();

    return () => {
      disposed = true;
      clearTimer();
      refreshRef.current = null;
      unsubscribeService();
      unsubscribeVisibility();
      document.removeEventListener('visibilitychange', synchronizeVisibility);
    };
  }, [waitForLocalComputer]);

  return { rawComputerList, agentSelectedMap, initialized, refresh };
}
