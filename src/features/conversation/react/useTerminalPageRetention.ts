import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { fullPageInstanceCacheManager } from '../runtime/fullPageInstanceCacheManager';

/** 终端随页面实例保留；容量仍有上限，资源回收时明确告知用户。 */
export function useTerminalPageRetention(cacheKey?: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!cacheKey) return;
    fullPageInstanceCacheManager.setTerminalSessionCount(cacheKey, count);
    return () =>
      fullPageInstanceCacheManager.setTerminalSessionCount(cacheKey, 0);
  }, [cacheKey, count]);
  useEffect(() => {
    if (!cacheKey) return;
    const unsubscribe = fullPageInstanceCacheManager.subscribeDispose(
      (entry, reason) => {
        if (
          entry.key === cacheKey &&
          entry.terminalSessionCount > 0 &&
          (reason === 'capacity' || reason === 'ide-capacity')
        ) {
          message.warning(
            dict('PC.Components.ConversationBottomConsole.cacheLimitReleased'),
          );
        }
      },
    );
    return () => {
      unsubscribe();
    };
  }, [cacheKey]);
  return setCount;
}
