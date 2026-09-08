import {
  CONVERSATION_DENSITY_EVENT,
  loadConversationDensity,
  resolveDensityPolicy,
  saveConversationDensity,
  type ConversationDensity,
} from '@/utils/conversationDensity';
import { useCallback, useEffect, useState } from 'react';

/**
 * 会话密度偏好（compact/normal/detailed）：读 localStorage 初始化，
 * 变更即时落盘并经全局事件跨组件同步（输入框入口设置 → 会话渲染立即生效）。
 */
export const useConversationDensity = (): {
  density: ConversationDensity;
  setDensity: (density: ConversationDensity) => void;
} => {
  const [density, setDensityState] = useState<ConversationDensity>(
    loadConversationDensity,
  );

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ density?: ConversationDensity }>)
        .detail;
      if (detail?.density) {
        setDensityState(detail.density);
      } else {
        setDensityState(loadConversationDensity());
      }
    };
    window.addEventListener(CONVERSATION_DENSITY_EVENT, sync);
    return () => window.removeEventListener(CONVERSATION_DENSITY_EVENT, sync);
  }, []);

  const setDensity = useCallback((next: ConversationDensity) => {
    setDensityState(next);
    saveConversationDensity(next);
  }, []);

  return { density, setDensity };
};

/** 便捷派生：当前密度对应的折叠策略 */
export const useDensityPolicy = () =>
  resolveDensityPolicy(useConversationDensity().density);
