import { useCallback, useState } from 'react';

/**
 * 生成页面间透传上下文 key
 * @param scope 业务作用域，如 appDevInitialPayload
 * @param id 业务唯一标识，如 projectId
 * @returns 页面间透传上下文 key
 */
export const createPageHandoffKey = (
  scope: string,
  id?: string | number,
): string => {
  return id === undefined || id === null ? scope : `${scope}:${id}`;
};

/**
 * 页面间一次性内存透传上下文 Model
 * 只保存在 SPA 运行期内存中，不写 URL、history.state、localStorage 或 sessionStorage。
 */
export default () => {
  const [contextMap, setContextMap] = useState<Record<string, unknown>>({});

  /**
   * 写入页面间透传上下文
   * @param key 上下文唯一 key
   * @param payload 业务上下文数据
   * @returns void
   */
  const setContext = useCallback(<T>(key: string, payload: T) => {
    setContextMap((prev) => ({
      ...prev,
      [key]: payload,
    }));
  }, []);

  /**
   * 读取页面间透传上下文，不会清理数据
   * @param key 上下文唯一 key
   * @returns 业务上下文数据
   */
  const getContext = useCallback(
    <T>(key?: string): T | undefined => {
      if (!key) {
        return undefined;
      }
      return contextMap[key] as T | undefined;
    },
    [contextMap],
  );

  /**
   * 清理页面间透传上下文
   * @param key 上下文唯一 key
   * @returns void
   */
  const clearContext = useCallback((key?: string) => {
    if (!key) {
      return;
    }

    setContextMap((prev) => {
      // 清理不存在的 key 必须保持原引用。Home 会在 effect 中消费一次性上下文，
      // 空消费若仍返回新对象，会让 contextMap 与 consumeContext 身份持续变化，
      // 从而反复触发该 effect，最终报 Maximum update depth exceeded。
      if (!Object.prototype.hasOwnProperty.call(prev, key)) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /**
   * 读取并清理页面间透传上下文
   * @param key 上下文唯一 key
   * @returns 业务上下文数据
   */
  const consumeContext = useCallback(
    <T>(key?: string): T | undefined => {
      const value = getContext<T>(key);
      clearContext(key);
      return value;
    },
    [clearContext, getContext],
  );

  return {
    contextMap,
    setContext,
    getContext,
    clearContext,
    consumeContext,
  };
};
