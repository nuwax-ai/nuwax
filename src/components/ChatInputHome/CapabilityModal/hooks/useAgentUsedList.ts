/**
 * 专家「最近召唤」列表 hook
 * @description 能力弹窗专家维度的最近使用数据源（复用最近使用接口
 * /api/user/agent/used/list，type=Agent 排除网页应用）：
 * - 「最近召唤」页签可见性判定（仅有记录时显示页签，置于数据源 tab 最前）；
 * - 页签数据为全量数组（按 size 单次拉取），关键字过滤在客户端完成。
 * 与 useSkillEnabledList 同构；本视图无移除操作，不提供 reload。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiUserUsedAgentList } from '@/services/agentDev';
import type { AgentInfo } from '@/types/interfaces/agent';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CapabilityItem } from '../types';

/** 「最近召唤」条目归一化：targetId 取智能体本体 ID（选中聘请按其寻址），
 * modified 即最近使用时间（卡片右上角相对时间） */
const mapUsedItem = (item: AgentInfo): CapabilityItem => ({
  key: `expert:used:${item.id}`,
  resourceType: 'expert',
  source: 'used',
  rawId: item.agentId ?? item.id,
  targetId: item.agentId ?? item.id,
  name: item.name,
  description: item.description,
  icon: item.icon,
  usedTime: item.modified,
});

const useAgentUsedList = (active: boolean) => {
  const [list, setList] = useState<CapabilityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 首拉完成标记：空列表区分「未加载」（不判定页签可见性）与「确无记录」（隐藏页签）
  const [loaded, setLoaded] = useState<boolean>(false);
  // 进行中的请求标识（过期响应丢弃）
  const requestIdRef = useRef<number>(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      // type=Agent：与专家维度同口径（ChatBot 智能体，排除网页应用）
      const res = await apiUserUsedAgentList({ size: 20, type: 'Agent' });
      if (requestIdRef.current !== requestId) {
        return;
      }
      if (res?.code !== SUCCESS_CODE) {
        throw new Error('agent used list failed');
      }
      setList(((res.data as AgentInfo[]) || []).map(mapUsedItem));
    } catch {
      if (requestIdRef.current === requestId) {
        setList([]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoaded(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (active) {
      void load();
    }
  }, [active, load]);

  return { list, loading, loaded };
};

export default useAgentUsedList;
