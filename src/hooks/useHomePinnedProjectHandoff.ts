/**
 * 首页项目上框页面透传 Hook
 * @description 项目列表（ProjectPanel）「+ 新建会话」→ /home 首页的项目上框透传：
 * 经 pageHandoffContext 内存一次性中转（不写 URL/storage，刷新即失效，符合产品约定）。
 * 写入方：ProjectPanel 项目行/子会话行的「+」按钮（本 hook 的 pin）；
 * 消费方：/home 首页（监听 contextMap 变化 consume 一次性读取，兼容已在 /home
 * 不重挂载的场景），以上框项目约束智能体可选范围并直接建会话绑定项目。
 */

import { createPageHandoffKey } from '@/models/pageHandoffContext';
import type { PinnedProjectInfo } from '@/types/interfaces/userProject';
import { useCallback } from 'react';
import { history, useModel } from 'umi';

export type { PinnedProjectInfo };

/** 透传作用域（无业务 id，全局单份；后一次 pin 自然覆盖前一次） */
const HOME_PINNED_PROJECT_SCOPE = 'homePinnedProject';

/**
 * 首页项目上框读写封装
 */
const useHomePinnedProjectHandoff = () => {
  const { setContext, consumeContext } = useModel('pageHandoffContext');

  /** 上框项目：写入透传上下文并跳转 /home 首页 */
  const pin = useCallback(
    (project: PinnedProjectInfo) => {
      setContext(createPageHandoffKey(HOME_PINNED_PROJECT_SCOPE), project);
      history.push('/home');
    },
    [setContext],
  );

  /** 消费上框项目（读取即清；无上框或刷新后返回 undefined） */
  const consume = useCallback(() => {
    // useModel 下发的方法丢失泛型签名，与 useSummonExpertHandoff 一致用 as 断言
    return consumeContext(createPageHandoffKey(HOME_PINNED_PROJECT_SCOPE)) as
      | PinnedProjectInfo
      | undefined;
  }, [consumeContext]);

  return { pin, consume };
};

export default useHomePinnedProjectHandoff;
