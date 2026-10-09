/**
 * 技能选择页面透传 Hook
 * @description 技能页（系统广场/团队空间）卡片「选择」→ /home 首页的技能选中态透传：
 * 经 pageHandoffContext 内存一次性中转（不写 URL/storage，刷新即失效，
 * 与专家召唤 useSummonExpertHandoff 同款机制，两份透传相互独立）。
 * 写入方：技能页「选择」按钮（本 hook 的 select）；
 * 消费方：/home 首页（挂载时 consume 一次性读取，展示技能 chip，
 * 提交对话时把 skillId 并入 /api/agent/conversation/chat 已有的 skillIds 入参）。
 */

import { createPageHandoffKey } from '@/models/pageHandoffContext';
import { useCallback } from 'react';
import { history, useModel } from 'umi';

/** 选择的技能信息（技能页 → /home 首页的页面间透传协议） */
export interface SelectedSkillInfo {
  /** 技能 ID：系统广场 = 发布项 targetId，团队空间 = 技能 id */
  skillId: number;
  /** 技能名称 */
  name: string;
  /** 技能图标（URL，可能为 /api/f/ 受保护地址，展示走 useAuthProtectedImageSrc） */
  icon?: string;
}

/** 透传作用域（无业务 id，全局单份；后一次选择自然覆盖前一次） */
const SELECTED_SKILL_SCOPE = 'homeSelectedSkill';

/**
 * 技能选择读写封装
 */
const useSelectSkillHandoff = () => {
  const { setContext, consumeContext } = useModel('pageHandoffContext');

  /** 选择技能：写入透传上下文并跳转 /home 首页 */
  const select = useCallback(
    (skill: SelectedSkillInfo) => {
      setContext(createPageHandoffKey(SELECTED_SKILL_SCOPE), skill);
      history.push('/home');
    },
    [setContext],
  );

  /** 消费选择态（读取即清；无选择或刷新后返回 undefined） */
  const consume = useCallback(() => {
    // useModel 下发的方法丢失泛型签名，与 useSummonExpertHandoff 一致用 as 断言
    return consumeContext(createPageHandoffKey(SELECTED_SKILL_SCOPE)) as
      | SelectedSkillInfo
      | undefined;
  }, [consumeContext]);

  return { select, consume };
};

export default useSelectSkillHandoff;
