import {
  apiPublishedAgentList,
  apiPublishedPluginList,
  apiPublishedSkillList,
  apiPublishedWorkflowList,
} from '@/services/square';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  SquarePublishedItemInfo,
  SquarePublishedListParams,
} from '@/types/interfaces/square';
import { DisplayRecommendTargetTypeEnum } from '../types';

export type PublishedListFetcher = (
  data: SquarePublishedListParams,
) => Promise<RequestResponse<Page<SquarePublishedItemInfo>>>;

export interface PublishedTargetSource {
  fetchApi: PublishedListFetcher;
  buildParams: (
    page: number,
    pageSize: number,
    kw?: string,
  ) => SquarePublishedListParams;
}

/**
 * 推荐目标类型 → 广场已发布列表数据源（与 Square 页一致）
 */
export const PUBLISHED_TARGET_SOURCE_MAP: Record<
  DisplayRecommendTargetTypeEnum,
  PublishedTargetSource
> = {
  [DisplayRecommendTargetTypeEnum.Agent]: {
    fetchApi: apiPublishedAgentList,
    buildParams: (page, pageSize, kw) => ({
      page,
      pageSize,
      category: '',
      kw,
      targetType: AgentComponentTypeEnum.Agent,
      targetSubType: 'ChatBot',
    }),
  },
  [DisplayRecommendTargetTypeEnum.PageApp]: {
    fetchApi: apiPublishedAgentList,
    buildParams: (page, pageSize, kw) => ({
      page,
      pageSize,
      category: '',
      kw,
      targetType: AgentComponentTypeEnum.Agent,
      targetSubType: 'PageApp',
    }),
  },
  [DisplayRecommendTargetTypeEnum.Skill]: {
    fetchApi: apiPublishedSkillList,
    buildParams: (page, pageSize, kw) => ({
      page,
      pageSize,
      category: '',
      kw,
    }),
  },
  [DisplayRecommendTargetTypeEnum.Plugin]: {
    fetchApi: apiPublishedPluginList,
    buildParams: (page, pageSize, kw) => ({
      page,
      pageSize,
      category: '',
      kw,
    }),
  },
  [DisplayRecommendTargetTypeEnum.Workflow]: {
    fetchApi: apiPublishedWorkflowList,
    buildParams: (page, pageSize, kw) => ({
      page,
      pageSize,
      category: '',
      kw,
    }),
  },
};
