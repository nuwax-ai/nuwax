/**
 * 连接器分类下拉字典 hook（新增 / 编辑连接器抽屉共用）
 *
 * GET /api/published/category/list 取 data 中 key 为 Connector 的
 * 根节点的 children 作为选项来源；value 用 children 的 key、label 用其
 * 展示文案（与 EcosystemSelectCategory 等既有该接口消费方约定一致）。
 *
 * enabled 为 false（抽屉未打开）时不请求；每次打开重新拉取保证字典最新。
 * 拉取失败静默降级为空选项列表，不阻塞表单其余部分。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiPublishedCategoryList } from '@/services/square';
import type { SquareCategoryInfo } from '@/types/interfaces/square';
import { useEffect, useState } from 'react';

/** 分类下拉选项（value = 已发布分类 children 的 key） */
export interface ConnectorCategoryOption {
  label: string;
  value: string;
}

const useConnectorCategoryOptions = (enabled: boolean) => {
  /** 分类下拉选项 */
  const [categoryOptions, setCategoryOptions] = useState<
    ConnectorCategoryOption[]
  >([]);
  /** 分类字典请求中（给下拉加 loading） */
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        setCategoryLoading(true);
        const response = await apiPublishedCategoryList();
        if (cancelled) return;
        if (response?.code === SUCCESS_CODE) {
          const list = Array.isArray(response?.data) ? response.data : [];
          const connectorRoot = list.find((item) => item.key === 'Connector');
          const children: SquareCategoryInfo[] = connectorRoot?.children ?? [];
          setCategoryOptions(
            children
              .filter((item) => Boolean(item?.key))
              .map((item) => ({
                label: item.label || item.key,
                value: item.key,
              })),
          );
        }
      } catch {
        // 分类字典拉取失败不阻塞表单：下拉为空，其余照常
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { categoryOptions, categoryLoading };
};

export default useConnectorCategoryOptions;
