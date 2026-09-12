/**
 * 资源二级分类字典 hook
 * @description
 * - 系统广场维度（source=system，"已连接的"维度同）：调用
 *   /api/published/category/list，
 *   按资源类型匹配根节点（expert/skill 按 type，connector 按 key=Connector），
 *   取其 children 作为分类字典；
 * - 团队空间维度（source=team）：调用 /api/space/list，将空间列表映射为分类字典；
 * - 接口未就绪/失败时降级为仅"全部"。
 */

import { dict } from '@/services/i18nRuntime';
import { apiPublishedCategoryList } from '@/services/square';
import { apiSpaceList } from '@/services/workspace';
import type { SquareCategoryInfo } from '@/types/interfaces/square';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { useCallback, useState } from 'react';
import { useRequest } from 'umi';
import { RESOURCE_TYPE_TO_CATEGORY_TYPE } from '../../../constants';
import type {
  ResourceCategoryInfo,
  ResourceSourceEnum,
  ResourceTypeEnum,
} from '../../../types';

/** 首位固定的"全部"分类 */
const ALL_TAB: ResourceCategoryInfo = {
  key: '',
  label: dict('PC.Pages.ExpertSkillConnector.tabAll'),
};

const useResourceCategories = (
  resourceType: ResourceTypeEnum,
  source: ResourceSourceEnum,
) => {
  const [categories, setCategories] = useState<ResourceCategoryInfo[]>([
    ALL_TAB,
  ]);

  /**
   * 系统广场维度：
   * 调用 /api/published/category/list，按 resourceType 找到对应根节点取其 children：
   * - expert/skill：按根节点 type（Agent/Skill）匹配；
   * - connector：与新建/编辑连接器抽屉同源，按根节点 key=Connector 匹配。
   */
  const fetchSystemCategories = useCallback(async () => {
    const res = await apiPublishedCategoryList();
    const list = (res?.data as SquareCategoryInfo[] | undefined) || [];
    const root = list.find((item) =>
      resourceType === 'connector'
        ? item.key === 'Connector'
        : item.type === RESOURCE_TYPE_TO_CATEGORY_TYPE[resourceType],
    );
    const children = root?.children || [];
    return children
      .filter((item) => Boolean(item?.key))
      .map((item) => ({ key: item.key, label: item.label || item.key }));
  }, [resourceType]);

  /**
   * 团队空间维度：
   * 调用 /api/space/list，将空间列表映射为分类字典。
   */
  const fetchTeamCategories = useCallback(async () => {
    const res = await apiSpaceList();
    const list = (res?.data as SpaceInfo[] | undefined) || [];
    return list.map((item) => ({
      key: String(item.id),
      label: item.name,
    }));
  }, []);

  const handleSuccess = useCallback(
    (list: { key: string; label: string }[]) => {
      setCategories([ALL_TAB, ...(list || [])]);
    },
    [],
  );

  // 不同数据源走不同接口；任一接口失败时静默降级（仅保留"全部"）；
  // "已连接的"维度与系统广场共用内容分类，缓存键归一化避免重复请求
  const fetcher =
    source === 'team' ? fetchTeamCategories : fetchSystemCategories;

  useRequest(fetcher, {
    refreshDeps: [resourceType, source],
    cacheKey: `esc-categories-${resourceType}-${
      source === 'team' ? 'team' : 'system'
    }`,
    // umi 的 useRequest 默认注入 formatResult: result => result?.data，
    // 而 fetcher 已在内部解包并返回归一化数组（无 data 字段），会被误取成 undefined，
    // 这里显式透传，保证 onSuccess 拿到 fetcher 的原始返回值
    formatResult: (list: { key: string; label: string }[]) => list,
    onSuccess: (list: { key: string; label: string }[]) =>
      handleSuccess(list || []),
    onError: () => handleSuccess([]),
  });

  return categories;
};

export default useResourceCategories;
