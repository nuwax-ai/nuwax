/**
 * 能力分类字典 hook
 * @description
 * - 系统广场维度：GET /api/published/category/list，按能力类型匹配根节点
 *   （Agent/Skill/Plugin/Knowledge），取 children 作为二级分类，首位固定"全部"；
 * - 团队空间维度：GET /api/space/list，专家/技能/连接器首位固定"全部" +
 *   空间列表（个人空间优先）；专家/技能"全部"经 spaceIds 聚合、连接器
 *   "全部"经 scope=space 聚合，资料库仅空间列表；
 * - 接口未就绪/失败时降级：系统广场仅"全部"、团队空间为空列表（由上层保持加载态）。
 */

import { dict } from '@/services/i18nRuntime';
import { apiPublishedCategoryList } from '@/services/square';
import { apiSpaceList } from '@/services/workspace';
import { SpaceTypeEnum } from '@/types/enums/space';
import type { SquareCategoryInfo } from '@/types/interfaces/square';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { useEffect, useState } from 'react';
import type {
  CapabilityCategoryInfo,
  CapabilitySourceEnum,
  CapabilityTypeEnum,
} from '../types';
import { CAPABILITY_TYPE_TO_CATEGORY_TYPE } from '../types';

/** 系统广场维度首位固定的"全部"分类 */
const ALL_CATEGORY: CapabilityCategoryInfo = {
  key: '',
  label: dict('PC.Components.CapabilityModal.tabAll'),
};

/** 空间排序：个人空间优先（type=Personal 判定），作为团队空间维度的默认选中 */
const sortSpacesPersonalFirst = (list: SpaceInfo[]): SpaceInfo[] =>
  [...list].sort((a, b) => {
    const aPersonal = a.type === SpaceTypeEnum.Personal ? 0 : 1;
    const bPersonal = b.type === SpaceTypeEnum.Personal ? 0 : 1;
    return aPersonal - bPersonal;
  });

const useCapabilityCategories = (
  resourceType: CapabilityTypeEnum,
  source: CapabilitySourceEnum,
) => {
  const [categories, setCategories] = useState<CapabilityCategoryInfo[]>([]);

  useEffect(() => {
    let cancelled = false;

    const applySystem = async () => {
      // 立即先出"全部"，避免接口慢时 pill 区空白
      if (!cancelled) {
        setCategories([ALL_CATEGORY]);
      }
      try {
        const res = await apiPublishedCategoryList();
        if (cancelled) {
          return;
        }
        const list = (res?.data as SquareCategoryInfo[] | undefined) || [];
        const rootType = CAPABILITY_TYPE_TO_CATEGORY_TYPE[resourceType];
        // 与广场页同口径：connector 按根节点 key=Connector 匹配
        // （与新建/编辑连接器抽屉同源），其余按根节点 type 匹配
        const children =
          list.find((item) =>
            resourceType === 'connector'
              ? item.key === 'Connector'
              : item.type === rootType,
          )?.children || [];
        setCategories([
          ALL_CATEGORY,
          ...children.map((item) => ({ key: item.key, label: item.label })),
        ]);
      } catch {
        // 失败降级：仅保留"全部"
      }
    };

    const applyTeam = async () => {
      if (!cancelled) {
        setCategories([]);
      }
      try {
        const res = await apiSpaceList();
        if (cancelled) {
          return;
        }
        const list = (res?.data as SpaceInfo[] | undefined) || [];
        // 个人空间排最前（type=Personal 判定）；专家/技能维度首位另加"全部"
        // 页签（上层经 spaceIds 聚合全部空间的已发布条目）；连接器维度首位
        // 同加"全部"（经 scope=space 聚合全部空间的连接器）
        const spacePills = sortSpacesPersonalFirst(list).map((item) => ({
          key: String(item.id),
          label: item.name,
        }));
        setCategories(
          resourceType === 'expert' ||
            resourceType === 'skill' ||
            resourceType === 'connector'
            ? [ALL_CATEGORY, ...spacePills]
            : spacePills,
        );
      } catch {
        // 失败降级：空列表，上层保持加载态
      }
    };

    if (source === 'team') {
      void applyTeam();
    } else {
      void applySystem();
    }

    return () => {
      cancelled = true;
    };
  }, [resourceType, source]);

  return categories;
};

export default useCapabilityCategories;
