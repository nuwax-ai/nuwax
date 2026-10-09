import { useConversationPageCache } from '@/features/conversation/react/useConversationPageCache';
import React, { useRef } from 'react';

interface CachedNode {
  node: React.ReactNode;
  exclusive: boolean;
}

interface ConversationInstanceCacheSlotProps {
  activeKey: string;
  active: boolean;
  retain: boolean;
  children: React.ReactNode;
  /** 同一时刻只保留一个真实实例，例如全局唯一的 VNC。 */
  exclusive?: boolean;
  testId?: string;
}

/**
 * 按统一缓存 manager 的条目生命周期保留 React 子树。路由切换只隐藏节点，
 * manager LRU 淘汰条目后才真正卸载，从而释放 WebSocket / iframe 等资源。
 */
const ConversationInstanceCacheSlot: React.FC<
  ConversationInstanceCacheSlotProps
> = ({
  activeKey,
  active,
  retain,
  children,
  exclusive = false,
  testId = 'conversation-instance-cache',
}) => {
  const snapshot = useConversationPageCache();
  const nodesRef = useRef(new Map<string, CachedNode>());
  const liveKeys = new Set(snapshot.entries.map((entry) => entry.key));

  nodesRef.current.forEach((_, key) => {
    if (!liveKeys.has(key)) nodesRef.current.delete(key);
  });

  if (retain) {
    if (exclusive) {
      nodesRef.current.forEach((cached, key) => {
        if (key !== activeKey && cached.exclusive) {
          nodesRef.current.delete(key);
        }
      });
    }
    nodesRef.current.set(activeKey, { node: children, exclusive });
  }

  return (
    <div data-testid={testId} style={{ width: '100%', height: '100%' }}>
      {[...nodesRef.current.entries()].map(([key, cached]) => {
        const visible = active && key === activeKey;
        return (
          <div
            key={key}
            data-cache-key={key}
            aria-hidden={!visible}
            style={{
              display: visible ? 'flex' : 'none',
              width: '100%',
              height: '100%',
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {cached.node}
          </div>
        );
      })}
    </div>
  );
};

export default ConversationInstanceCacheSlot;
