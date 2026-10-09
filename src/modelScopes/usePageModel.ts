import React, { useContext } from 'react';
import { useModel as useGlobalModel } from 'umi';

/**
 * 常驻页面的局部 model 覆盖表。未被覆盖的 namespace 仍沿用 Umi 全局 model。
 * 只在已完成隔离的页面实例树里注入，不改变其余路由的消费契约。
 */
export type PageModelValues = Record<string, unknown>;

export const PageModelScopeContext =
  React.createContext<PageModelValues | null>(null);

/**
 * 调用全局 hook 保持 hook 顺序稳定；作用域命中时以本实例的 model 值为准。
 * 类型签名与 Umi useModel 相同，便于逐个迁移真实会话消费点。
 */
export const usePageModel = ((
  namespace: string,
  selector?: (value: unknown) => unknown,
) => {
  const scoped = useContext(PageModelScopeContext);
  const hasLocalValue =
    !!scoped && Object.prototype.hasOwnProperty.call(scoped, namespace);
  // 局部实例无需订阅全局 model 的每次消息更新：订阅保持 hook 顺序，选择值固定。
  const globalValue = useGlobalModel(
    namespace as never,
    (hasLocalValue ? () => undefined : selector) as never,
  );
  const localValue = scoped?.[namespace];
  if (!hasLocalValue) return globalValue;
  return selector ? selector(localValue) : localValue;
}) as typeof useGlobalModel;
