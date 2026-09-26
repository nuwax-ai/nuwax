import throttle from 'lodash/throttle';
import { useLayoutEffect, useMemo, useRef } from 'react';

export interface WorkspaceFileRefreshOptions {
  active: boolean;
  conversationId: number;
  refresh: () => void | Promise<unknown>;
}

/** runtime 首次捕获资源回调：入口保持稳定，当前可见会话与刷新方法从 ref 读取。 */
export const useWorkspaceFileRefresh = (
  options: WorkspaceFileRefreshOptions,
) => {
  const latest = useRef(options);
  latest.current = options;
  const mounted = useRef(true);
  const handle = useMemo(
    () =>
      throttle(
        (id: number) => {
          const current = latest.current;
          if (
            mounted.current &&
            current.active &&
            current.conversationId === id
          )
            void current.refresh();
        },
        2000,
        { leading: true, trailing: true },
      ),
    [],
  );
  useLayoutEffect(() => {
    // 切会话/隐藏时清旧尾任务；回调自身也核验当前 id，阻止 render 到 cleanup 间串会话。
    handle.cancel();
  }, [options.active, options.conversationId, handle]);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      handle.cancel();
    };
  }, [handle]);
  return handle;
};
