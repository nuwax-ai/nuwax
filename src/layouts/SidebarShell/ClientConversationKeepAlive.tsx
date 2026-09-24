import {
  fullPageInstanceCacheManager,
  useFullPageInstanceCache,
} from '@/features/conversation/react/useFullPageInstanceCache';
import useStyle3PcKeepAliveEnabled from '@/hooks/useStyle3PcKeepAliveEnabled';
import { ConfigProvider } from 'antd';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { history, useLocation, useModel } from 'umi';
import { parseClientConversationRoute } from './clientConversationRoute';

/**
 * PC style3 的整页宿主。页面渲染器由对应路由 chunk 注册，布局层不反向依赖页面。
 * style1/style2、移动端及未完成隔离的页面保持原路由生命周期。
 */
const ClientConversationKeepAlive: React.FC = () => {
  const location = useLocation();
  const { clientConversationRenderers } = useModel('appTabKeepAlive');
  const cache = useFullPageInstanceCache();
  const routeSnapshots = useRef(
    new Map<string, ReturnType<typeof parseClientConversationRoute>>(),
  );
  const keepAliveEnabled = useStyle3PcKeepAliveEnabled();
  const currentRoute = keepAliveEnabled
    ? parseClientConversationRoute({
        ...location,
        navigationAction: history.action,
      })
    : null;
  const currentRenderer = currentRoute
    ? clientConversationRenderers[currentRoute.kind]
    : undefined;
  const activeKey = currentRenderer ? currentRoute?.key ?? null : null;

  if (currentRoute && currentRenderer) {
    routeSnapshots.current.set(currentRoute.key, currentRoute);
  }

  useLayoutEffect(() => {
    if (!keepAliveEnabled) {
      fullPageInstanceCacheManager.invalidateAll('style3-pc-disabled');
      routeSnapshots.current.clear();
      return;
    }

    const oldActiveKey = fullPageInstanceCacheManager.getSnapshot().activeKey;
    if (!activeKey || !currentRoute) {
      if (oldActiveKey) fullPageInstanceCacheManager.deactivate(oldActiveKey);
      return;
    }

    const wasCached = !!fullPageInstanceCacheManager.getEntry(activeKey);
    const startedAt = performance.now();
    fullPageInstanceCacheManager.activate({
      key: activeKey,
      kind: currentRoute.kind,
      conversationId: currentRoute.conversationId,
    });

    const frame = requestAnimationFrame(() => {
      const durationMs = Math.round(performance.now() - startedAt);
      const perf = (window as any).NuwaClawBridge?.perf;
      if (perf?.enabled?.()) {
        const entries = fullPageInstanceCacheManager.getSnapshot().entries;
        const heapUsedBytes = (
          performance as Performance & {
            memory?: { usedJSHeapSize?: number };
          }
        ).memory?.usedJSHeapSize;
        perf.mark?.('client_page_switch', {
          kind: currentRoute.kind,
          cached: wasCached,
          durationMs,
          instanceCount: entries.length,
          runningInstanceCount: entries.filter((entry) => entry.running).length,
          ...(heapUsedBytes === undefined ? {} : { heapUsedBytes }),
        });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [activeKey, keepAliveEnabled]);

  useEffect(() => {
    const liveKeys = new Set(cache.entries.map((entry) => entry.key));
    routeSnapshots.current.forEach((_, key) => {
      if (key !== activeKey && !liveKeys.has(key)) {
        routeSnapshots.current.delete(key);
      }
    });
  }, [activeKey, cache]);

  const rendered = cache.entries.flatMap((entry) => {
    const route = routeSnapshots.current.get(entry.key);
    if (!route) return [];
    const Renderer = clientConversationRenderers[entry.kind];
    if (!Renderer) return [];
    const active = entry.key === activeKey;
    return [
      <div
        key={entry.key}
        data-client-page-key={entry.key}
        aria-hidden={!active}
        className="h-full w-full"
        style={{ display: active ? 'block' : 'none' }}
      >
        <ConfigProvider
          getPopupContainer={(triggerNode) =>
            (triggerNode?.closest('[data-client-page-key]') as HTMLElement) ??
            document.body
          }
        >
          <Renderer route={route} active={active} />
        </ConfigProvider>
      </div>,
    ];
  });

  return (
    <div
      className="h-full w-full"
      data-testid="client-conversation-keepalive"
      aria-hidden={!activeKey}
      style={{ display: activeKey ? 'block' : 'none' }}
    >
      {rendered}
    </div>
  );
};

export default ClientConversationKeepAlive;
