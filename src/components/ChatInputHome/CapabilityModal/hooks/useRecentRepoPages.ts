/**
 * 资料库「最近访问」列表 hook
 * @description 能力弹窗资料库维度的最近访问数据源（门户最近访问接口
 * /api/repo/pages/recently-accessed，访问记录 ∪ 我编辑过，跨全部空间）：
 * - 「最近访问」页签可见性判定（仅有记录时显示页签，置于空间 pill 最前）；
 * - 页签数据为全量数组（按 size 单次拉取），关键字过滤在客户端完成。
 * 与 useAgentUsedList 同构；本视图无移除操作，不提供 reload。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiRepoRecentlyAccessedPages } from '@/services/repo';
import type { RepoPortalPageInfo } from '@/types/interfaces/repo';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CapabilityItem } from '../types';
import { normalizeDocType } from './useCapabilityResources';

/** 「最近访问」条目归一化：time 即最近访问/编辑时间（仅本视图卡片展示相对时间胶囊） */
const mapRecentItem = (item: RepoPortalPageInfo): CapabilityItem => ({
  key: `knowledge:recent:${item.id}`,
  resourceType: 'knowledge',
  source: 'recent',
  rawId: item.id,
  slugId: item.slugId,
  name: item.title ?? '',
  pageType: item.pageType,
  // 文档类型：源文件扩展名优先，无则回落接口 pageType
  fileType: normalizeDocType(item.sourceExt, item.pageType),
  usedTime: item.time,
});

const useRecentRepoPages = (active: boolean) => {
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
      const res = await apiRepoRecentlyAccessedPages({ from: 0, size: 20 });
      if (requestIdRef.current !== requestId) {
        return;
      }
      if (res?.code !== SUCCESS_CODE) {
        throw new Error('repo recently accessed failed');
      }
      setList(((res.data as RepoPortalPageInfo[]) || []).map(mapRecentItem));
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

export default useRecentRepoPages;
