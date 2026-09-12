/**
 * 技能「我启用的」列表 hook
 * @description 能力弹窗技能维度的启用态数据源：
 * - 「我启用的」页签可见性判定（仅存在启用技能时显示页签）；
 * - 「我启用的」页签数据（enable/list 返回全量数组非分页，关键字过滤在客户端完成）。
 * 启用/取消启用成功后调 reload 同步页签可见性与列表内容（取消最后一项时
 * 上层凭空列表自动回落系统广场源）。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiPublishedSkillEnableList } from '@/services/square';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CapabilityItem } from '../types';
import { mapPublishedItem } from './useCapabilityResources';

/**
 * 「我启用的」页签条目归一化：source 标记为 enabled（区别于 system/team 列表 key）。
 * enable/list 是专门接口：能拉回来的即已启用，一律置 enabled=true——
 * 不看条目级 enabled 字段（该接口可能显式下发 enabled:false，
 * 按字段渲染会把启用中的开关错显示为未启用）
 */
const mapEnabledItem = (item: SquarePublishedItemInfo): CapabilityItem => ({
  ...mapPublishedItem(item, 'skill', 'enabled'),
  enabled: true,
});

const useSkillEnabledList = (active: boolean) => {
  const [list, setList] = useState<CapabilityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 首拉完成标记：空列表区分「未加载」（不判定页签可见性）与「确无启用技能」（隐藏页签）
  const [loaded, setLoaded] = useState<boolean>(false);
  // 进行中的请求标识（过期响应丢弃）
  const requestIdRef = useRef<number>(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await apiPublishedSkillEnableList();
      if (requestIdRef.current !== requestId) {
        return;
      }
      if (res?.code !== SUCCESS_CODE) {
        throw new Error('skill enabled list failed');
      }
      setList(
        ((res.data as SquarePublishedItemInfo[]) || []).map(mapEnabledItem),
      );
    } catch {
      if (requestIdRef.current === requestId) {
        // 失败保持已有列表（页签可见性不闪变），仅标记已尝试加载
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
      void reload();
    }
  }, [active, reload]);

  return { list, loading, loaded, reload };
};

export default useSkillEnabledList;
