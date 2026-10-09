/**
 * 专家召唤页面透传 Hook
 * @description 专家&专家团页卡片「召唤」→ /home 首页的专家选中态透传：
 * 经 pageHandoffContext 内存一次性中转（不写 URL/storage，刷新即失效，符合产品约定）。
 * 写入方：专家页「召唤」按钮（本 hook 的 summon）；
 * 消费方：/home 首页（挂载时 consume 一次性读取，以该专家身份创建会话，
 * 专家 = 会话 agent，/api/agent/conversation/chat 无需任何改动）。
 */

import { createPageHandoffKey } from '@/models/pageHandoffContext';
import { useCallback } from 'react';
import { history, useModel } from 'umi';

/** 召唤的专家信息（专家页 → /home 首页的页面间透传协议） */
export interface SummonedExpertInfo {
  /** 专家（团）对应的智能体 ID：系统广场 = 发布项 targetId，团队空间 = 智能体 id */
  agentId: number;
  /** 专家名称 */
  name: string;
  /** 专家图标（URL，可能为 /api/f/ 受保护地址，展示走 useAuthProtectedImageSrc） */
  icon?: string;
}

/** 透传作用域（无业务 id，全局单份；后一次召唤自然覆盖前一次） */
const SUMMONED_EXPERT_SCOPE = 'homeSummonedExpert';

/**
 * 专家召唤读写封装
 */
const useSummonExpertHandoff = () => {
  const { setContext, consumeContext } = useModel('pageHandoffContext');

  /** 召唤专家：写入透传上下文并跳转 /home 首页 */
  const summon = useCallback(
    (expert: SummonedExpertInfo) => {
      setContext(createPageHandoffKey(SUMMONED_EXPERT_SCOPE), expert);
      history.push('/home');
    },
    [setContext],
  );

  /** 消费召唤态（读取即清；无召唤或刷新后返回 undefined） */
  const consume = useCallback(() => {
    // useModel 下发的方法丢失泛型签名，与 useAppDevInitialAutoSend 一致用 as 断言
    return consumeContext(createPageHandoffKey(SUMMONED_EXPERT_SCOPE)) as
      | SummonedExpertInfo
      | undefined;
  }, [consumeContext]);

  return { summon, consume };
};

export default useSummonExpertHandoff;
