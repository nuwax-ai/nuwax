/**
 * 广场智能体上框页面透传 Hook（bug 2398）
 * @description 广场/空间广场智能体卡片点击 → /home 首页输入框上框该智能体：
 * 经 pageHandoffContext 内存一次性中转（不写 URL/storage，刷新即失效）。
 * 写入方：广场卡片点击（useSpaceSquare.handleClick 智能体分支，付费拦截
 * 由调用方 useAgentPaymentIntercept 包装，放行后进入本通道不受影响）；
 * 消费方：/home 首页（挂载时 consume 一次性读取，映射进「召唤专家」同一
 * 会话智能体槽位——chip 展示 + 提交时以该智能体身份创建会话，链路零改动）。
 */

import { createPageHandoffKey } from '@/models/pageHandoffContext';
import { useCallback } from 'react';
import { history, useModel } from 'umi';

/** 上框的广场智能体信息（广场 → /home 首页的页面间透传协议） */
export interface PinnedAgentInfo {
  /** 智能体 ID（广场 = 发布项 targetId） */
  agentId: number;
  /** 智能体名称 */
  name: string;
  /** 智能体图标（URL，可能为 /api/f/ 受保护地址，展示走 useAuthProtectedImageSrc） */
  icon?: string;
}

/** 透传作用域（无业务 id，全局单份；后一次上框自然覆盖前一次） */
const PINNED_AGENT_SCOPE = 'homePinnedAgent';

/**
 * 广场智能体上框读写封装
 */
const usePinnedAgentHandoff = () => {
  const { setContext, consumeContext } = useModel('pageHandoffContext');

  /** 上框智能体：写入透传上下文并跳转 /home 首页 */
  const pin = useCallback(
    (agent: PinnedAgentInfo) => {
      setContext(createPageHandoffKey(PINNED_AGENT_SCOPE), agent);
      history.push('/home');
    },
    [setContext],
  );

  /** 消费上框态（读取即清；无上框或刷新后返回 undefined） */
  const consume = useCallback(() => {
    // useModel 下发的方法丢失泛型签名，与 useSummonExpertHandoff 一致用 as 断言
    return consumeContext(createPageHandoffKey(PINNED_AGENT_SCOPE)) as
      | PinnedAgentInfo
      | undefined;
  }, [consumeContext]);

  return { pin, consume };
};

export default usePinnedAgentHandoff;
