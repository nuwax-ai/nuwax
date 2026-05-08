import {
  getIframeTargetOrigin,
  isDesignModeChangedMessage,
  isValidIframeMessage,
} from '@/utils/iframeMessageValidator';
import { useCallback, useEffect, useRef, useState } from 'react';

type TabType = 'chat' | 'data' | 'design';

// 设计模式确认超时时间（毫秒）
const DESIGN_MODE_ACK_TIMEOUT = 1800;

// postMessage 因 iframe 处于过渡 origin（如 about:blank）失败时的最大重试次数
const POSTMESSAGE_MAX_RETRY = 3;

// 每次重试间隔（毫秒）。覆盖「iframe.src 已更新但 contentWindow 还没真正 navigate」的窗口
const POSTMESSAGE_RETRY_DELAY = 500;

// 是否启用调试日志
const DEBUG = process.env.NODE_ENV === 'development';

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[DesignModeSync] ${message}`, data);
  }
};

interface UseDesignModeTabSyncParams {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isIframeLoaded: boolean;
  isSupportDesignMode: boolean;
  iframeDesignMode: boolean;
  setIframeDesignMode: (enabled: boolean) => void;
  previewIframeElement: HTMLIFrameElement | null;
  /**
   * TOGGLE_DESIGN_MODE 的 ack 在超时窗口内没回，说明 iframe 内 design runtime 没生效，
   * 这是「老项目 / 需要重启 dev server」的运行时信号。dedup 由调用方负责（同一项目应只重启一次）。
   */
  onAckTimeout?: (info: {
    requestId: string;
    targetEnabled: boolean;
    sentAt: number;
  }) => void;
}

/**
 * 管理 Design Tab 与 iframe 设计模式的同步状态机。
 * 目标：
 * 1) 由 Tab 交互主导 UI 状态，避免与回执互相驱动造成回环；
 * 2) 通过 requestId 对齐回执，过滤旧消息与乱序消息；
 * 3) 只接收目标 iframe 来源消息，降低跨消息源干扰。
 */
export const useDesignModeTabSync = ({
  activeTab,
  setActiveTab,
  isIframeLoaded,
  isSupportDesignMode,
  iframeDesignMode,
  setIframeDesignMode,
  previewIframeElement,
  onAckTimeout,
}: UseDesignModeTabSyncParams) => {
  // ref 持有最新回调，避免回调引用变化导致 syncIframeDesignMode 重新创建。
  const onAckTimeoutRef = useRef(onAckTimeout);
  useEffect(() => {
    onAckTimeoutRef.current = onAckTimeout;
  }, [onAckTimeout]);
  const [transitionState, setTransitionState] = useState<
    'idle' | 'pending' | 'confirmed' | 'failed'
  >('idle');
  const [pendingTargetEnabled, setPendingTargetEnabled] = useState(false);

  const pendingToggleRef = useRef<{
    requestId: string;
    targetEnabled: boolean;
    sentAt: number;
  } | null>(null);

  const ackTimeoutRef = useRef<number | null>(null);

  // dev server 重启后 iframe 在「about:blank → 真实 URL」之间会有短暂过渡期，
  // 此时 iframe.src 已指向新 origin 但 contentWindow 仍在 localhost，postMessage 会抛错。
  // 用 ref 跟踪重试次数和待执行的重试 timer。
  const postMessageRetryRef = useRef(0);
  const postMessageRetryTimerRef = useRef<number | null>(null);

  const clearAckTimeout = () => {
    if (ackTimeoutRef.current !== null) {
      window.clearTimeout(ackTimeoutRef.current);
      ackTimeoutRef.current = null;
    }
  };

  const clearPostMessageRetry = () => {
    if (postMessageRetryTimerRef.current !== null) {
      window.clearTimeout(postMessageRetryTimerRef.current);
      postMessageRetryTimerRef.current = null;
    }
  };

  const createRequestId = () =>
    `design_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const syncIframeDesignMode = useCallback(
    (enabled: boolean) => {
      const iframe = previewIframeElement;
      const pendingBefore = pendingToggleRef.current;

      // 检查 iframe 是否就绪
      if (!iframe || !iframe.contentWindow) {
        debugLog('sync skipped: iframe not ready', {
          enabled,
          hasIframe: !!iframe,
          hasContentWindow: !!iframe?.contentWindow,
          pendingBefore,
          isIframeLoaded,
          activeTab,
        });
        return;
      }

      // 若当前已有相同目标的 pending 请求，直接复用该事务并跳过重复发送。
      // 这样可以避免：
      // 1) 连续相同状态触发导致 requestId 被频繁替换；
      // 2) 新请求取消旧请求后又因乱序回执造成误判；
      // 3) UI 状态在 pending/failed 间抖动。
      if (
        pendingToggleRef.current &&
        pendingToggleRef.current.targetEnabled === enabled
      ) {
        debugLog('skip duplicate pending request', {
          requestId: pendingToggleRef.current.requestId,
          targetEnabled: pendingToggleRef.current.targetEnabled,
        });
        return;
      }

      // 如果有不同目标的 pending 请求，先取消旧事务再发起新事务。
      if (pendingToggleRef.current) {
        clearAckTimeout();
        debugLog('cancelling previous request', {
          previousRequestId: pendingToggleRef.current.requestId,
        });
      }

      const requestId = createRequestId();
      const sentAt = Date.now();

      pendingToggleRef.current = { requestId, targetEnabled: enabled, sentAt };
      setTransitionState('pending');
      setPendingTargetEnabled(enabled);
      clearAckTimeout();

      ackTimeoutRef.current = window.setTimeout(() => {
        if (pendingToggleRef.current?.requestId === requestId) {
          setTransitionState('failed');
          setPendingTargetEnabled(false);
          // 清空 pending 事务，否则后续 iframe 重新加载触发 auto-sync 时
          // 会被「相同 target 已 pending」的去重逻辑（syncIframeDesignMode 顶部）拦掉，
          // 导致 dev server 重启成功后 design 模式无法自动恢复，必须用户手动切回 chat 再切 design。
          pendingToggleRef.current = null;
          ackTimeoutRef.current = null;
          debugLog('ack timeout snapshot', {
            requestId,
            targetEnabled: enabled,
            pendingNow: pendingToggleRef.current,
            isIframeLoaded,
            activeTab,
          });
          console.warn('[DesignModeSync] toggle design mode ack timeout', {
            requestId,
            targetEnabled: enabled,
            sentAt,
          });
          // 仅在「尝试开启 design 模式」失败时才上抛恢复信号；
          // 关闭 design / 默认 chat tab 自动同步 false 时即使超时，也不应触发 dev server 重启。
          if (enabled) {
            onAckTimeoutRef.current?.({
              requestId,
              targetEnabled: enabled,
              sentAt,
            });
          }
        }
      }, DESIGN_MODE_ACK_TIMEOUT);

      debugLog('syncIframeDesignMode', {
        enabled,
        requestId,
        hasIframe: !!iframe,
        hasContentWindow: !!iframe?.contentWindow,
        isIframeLoaded,
        activeTab,
        transitionState: 'pending',
      });

      // 使用安全的 targetOrigin
      const targetOrigin = getIframeTargetOrigin(iframe);

      // 生产环境下避免使用通配符
      if (targetOrigin === '*' && process.env.NODE_ENV === 'production') {
        console.error(
          '[DesignModeSync] Cannot determine iframe origin in production',
        );
        setTransitionState('failed');
        setPendingTargetEnabled(false);
        clearAckTimeout();
        pendingToggleRef.current = null;
        return;
      }

      // postMessage 在 origin 不匹配时不会抛异常，而是把错误打到 console 后**静默丢弃**——
      // 所以无法用 try/catch 兜住。只能主动判断 contentWindow 当前实际 origin：
      //   - location 可读：iframe 仍在 same-origin 过渡态（about:blank / parent localhost），
      //     此时往跨源 targetOrigin 投递必然被丢弃，需要 defer + 重试
      //   - location 抛 SecurityError：contentWindow 已经 navigate 到目标跨源 URL，安全投递
      const cw = iframe.contentWindow;
      let canDeliver = true;
      try {
        const actualOrigin = cw.location.origin;
        canDeliver = actualOrigin === targetOrigin;
      } catch {
        // 跨源访问被拒 → contentWindow 已在跨源 target 上 → 可以投递
        canDeliver = true;
      }

      if (!canDeliver) {
        console.warn(
          '[DesignModeSync] iframe at transitional origin, deferring postMessage',
          { targetOrigin, attempt: postMessageRetryRef.current },
        );
        // 回滚刚刚为本次请求设置的 pending 状态与 ack timer，让重试可以重新走完整流程，
        // 也避免 ackTimeout 把过渡态当作业务超时上抛 onAckTimeout。
        clearAckTimeout();
        pendingToggleRef.current = null;
        setTransitionState('idle');
        setPendingTargetEnabled(false);

        if (postMessageRetryRef.current < POSTMESSAGE_MAX_RETRY) {
          postMessageRetryRef.current += 1;
          clearPostMessageRetry();
          postMessageRetryTimerRef.current = window.setTimeout(() => {
            postMessageRetryTimerRef.current = null;
            syncIframeDesignMode(enabled);
          }, POSTMESSAGE_RETRY_DELAY);
        } else {
          // 超过重试次数仍未到目标 origin，放弃本轮；用户切 tab 或 iframe 重新加载会再次触发。
          postMessageRetryRef.current = 0;
          console.warn(
            '[DesignModeSync] postMessage retries exhausted, giving up',
          );
        }
        return;
      }

      debugLog('posting TOGGLE_DESIGN_MODE', {
        enabled,
        requestId,
        targetOrigin,
        pendingBefore,
        pendingAfter: pendingToggleRef.current,
      });
      cw.postMessage(
        {
          type: 'TOGGLE_DESIGN_MODE',
          enabled,
          requestId,
          timestamp: Date.now(),
        },
        targetOrigin,
      );
      postMessageRetryRef.current = 0;
    },
    [previewIframeElement, isIframeLoaded, activeTab],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      const isAckMessage =
        data &&
        data.type === 'ACKNOWLEDGEMENT' &&
        typeof data.requestId === 'string';
      const isDesignChanged = isDesignModeChangedMessage(data);

      // 仅处理设计模式事务相关消息：ACK 与 DESIGN_MODE_CHANGED。
      // 其他消息交给其他模块处理，避免在这里过度消费 postMessage 事件。
      if (!isAckMessage && !isDesignChanged) {
        return;
      }

      let iframeSrcOrigin: string | null = null;
      try {
        iframeSrcOrigin = previewIframeElement?.src
          ? new URL(previewIframeElement.src).origin
          : null;
      } catch {
        iframeSrcOrigin = 'invalid-iframe-src';
      }
      const sourceMatched = !!(
        previewIframeElement?.contentWindow &&
        event.source === previewIframeElement.contentWindow
      );
      const originMatched =
        !!iframeSrcOrigin && iframeSrcOrigin === event.origin;

      debugLog('received design sync message', {
        type: data?.type,
        requestId: data?.requestId,
        enabled: data?.enabled,
        origin: event.origin,
        sourceMatched,
        originMatched,
        iframeSrcOrigin,
        hasIframe: !!previewIframeElement,
        hasIframeWindow: !!previewIframeElement?.contentWindow,
        pendingRequestId: pendingToggleRef.current?.requestId,
        pendingTarget: pendingToggleRef.current?.targetEnabled,
      });

      // 验证消息来源
      if (!isValidIframeMessage(event, previewIframeElement)) {
        debugLog('ignore design sync message by source', {
          type: data?.type,
          origin: event.origin,
          sourceMatched,
          originMatched,
          iframeSrcOrigin,
          iframeSrc: previewIframeElement?.src || null,
        });
        return;
      }

      const pending = pendingToggleRef.current;
      const requestId =
        typeof data?.requestId === 'string' ? data.requestId : undefined;

      // ACK 是传输层回执：仅表示 iframe 收到了请求，不表示设计模式一定已生效。
      // 事务“真正成功”必须由业务层 DESIGN_MODE_CHANGED 确认，避免出现：
      // 1) ACK 已到但业务状态未更新，UI 误判为成功；
      // 2) pending 被提前清空后，真正的 DESIGN_MODE_CHANGED 反而被当作 stale；
      // 3) Design tab 显示已切换但 iframe 内功能未生效。
      if (isAckMessage) {
        const ackMatched =
          !!pending && !!requestId && requestId === pending.requestId;

        if (!ackMatched) {
          debugLog('ignore stale ACKNOWLEDGEMENT', {
            requestId,
            pendingRequestId: pending?.requestId,
            pendingTarget: pending?.targetEnabled,
          });
          return;
        }

        debugLog('received ACKNOWLEDGEMENT (matched)', {
          requestId,
          origin: event.origin,
          pendingTarget: pending?.targetEnabled,
        });
        return;
      }

      const { enabled } = data;
      const requestMatched =
        !!pending && !!requestId && requestId === pending.requestId;

      // 兼容历史协议：某些旧版 iframe 客户端不会回传 requestId。
      // 在这种情况下，若当前存在 pending 事务且 enabled 与目标值一致，
      // 说明该消息高度可能就是本次切换的回执，可视为 ACK 以结束 pending。
      //
      // 这样做的目的：
      // 1) 避免父页面升级到 requestId 协议后，旧 iframe 一直触发 ack timeout；
      // 2) 在已通过 source/origin 校验的前提下，尽量保持切换流程可用；
      // 3) 仍保留 requestId 优先策略：只在 requestId 缺失时走该兼容分支。
      if (!requestId) {
        debugLog('observe legacy DESIGN_MODE_CHANGED', {
          enabled,
          origin: event.origin,
          hasPending: !!pending,
          pendingRequestId: pending?.requestId,
          pendingTarget: pending?.targetEnabled,
        });

        if (pending && pending.targetEnabled === Boolean(enabled)) {
          clearAckTimeout();
          setTransitionState('confirmed');
          setPendingTargetEnabled(false);
          pendingToggleRef.current = null;
          debugLog('received legacy DESIGN_MODE_CHANGED (assume matched)', {
            enabled,
            origin: event.origin,
          });
        }

        setIframeDesignMode(Boolean(enabled));
        return;
      }

      if (!requestMatched) {
        debugLog('ignore stale DESIGN_MODE_CHANGED', {
          enabled,
          requestId,
          pendingRequestId: pending?.requestId,
          pendingTarget: pending?.targetEnabled,
        });
        return;
      }

      clearAckTimeout();
      setTransitionState('confirmed');
      setPendingTargetEnabled(false);
      debugLog('received DESIGN_MODE_CHANGED (matched)', {
        enabled,
        requestId,
        origin: event.origin,
      });

      setIframeDesignMode(Boolean(enabled));
      pendingToggleRef.current = null;
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setIframeDesignMode, previewIframeElement]);

  useEffect(() => {
    if (!isIframeLoaded) {
      return;
    }
    // 默认 tab 同步（例如页面默认打开 design）
    syncIframeDesignMode(activeTab === 'design');
  }, [activeTab, isIframeLoaded, syncIframeDesignMode]);

  useEffect(() => {
    debugLog('iframeDesignMode update', {
      iframeDesignMode,
      activeTab,
      transitionState,
    });
  }, [iframeDesignMode, activeTab, transitionState]);

  // iframe 元素或 src 变化时（典型场景：dev server 重启），重置 postMessage 重试计数，
  // 让新一轮 navigation 上的失败重新获得完整重试预算。
  useEffect(() => {
    postMessageRetryRef.current = 0;
    clearPostMessageRetry();
  }, [previewIframeElement, previewIframeElement?.src]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearAckTimeout();
      clearPostMessageRetry();
      pendingToggleRef.current = null;
      setTransitionState('idle');
    };
  }, []);

  const handleTabChange = useCallback(
    (value: TabType) => {
      debugLog('handleTabChange', {
        nextTab: value,
        activeTab,
        isIframeLoaded,
        isSupportDesignMode,
        iframeDesignMode,
      });

      if (value === 'design' && !isIframeLoaded) {
        return;
      }

      // 由 Tab 交互主导 UI，避免回执反向驱动导致回环。
      setActiveTab(value);
    },
    [
      activeTab,
      isIframeLoaded,
      isSupportDesignMode,
      iframeDesignMode,
      setActiveTab,
    ],
  );

  return {
    handleTabChange,
    syncIframeDesignMode,
    transitionState,
    isDesignModeLoading:
      !isIframeLoaded ||
      (transitionState === 'pending' &&
        pendingTargetEnabled &&
        activeTab === 'design'),
  };
};
