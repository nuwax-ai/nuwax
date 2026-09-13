import { CategoryTypeEnum } from '@/types/enums/agent';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  SquareCategoryInfo,
  SquarePublishedItemInfo,
  SquarePublishedListParams,
} from '@/types/interfaces/square';
import { request } from 'umi';

// 已发布插件列表接口（广场以及弹框选择中全部插件）
export async function apiPublishedPluginList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/plugin/list', {
    method: 'POST',
    data,
  });
}

// 已发布工作流列表接口（广场以及弹框选择中全部插件）
export async function apiPublishedWorkflowList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/workflow/list', {
    method: 'POST',
    data,
  });
}

// 已发布知识库列表接口（广场以及弹框选择中全部插件）
export async function apiPublishedKnowledgeList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/knowledge/list', {
    method: 'POST',
    data,
  });
}

// 广场-已发布智能体列表接口
// （专家&专家团-团队空间维度同用本接口：category=Agent +
// justReturnSpaceData + spaceId 查空间内已发布智能体）
export async function apiPublishedAgentList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/agent/list', {
    method: 'POST',
    data,
  });
}

/**
 * 女娲应用-应用列表接口（系统应用/团队空间两维度共用）
 * @description POST /api/published/app/list——
 * 系统应用：scope=system + official=true 查官方应用（category/kw 可选筛选）；
 * 团队空间：scope=space + justReturnSpaceData=true 查空间已发布应用，
 * 选中具体空间追加 spaceId
 */
export async function apiPublishedAppList(data: {
  /** 数据范围：system = 系统应用 / space = 团队空间维度 */
  scope: 'system' | 'space';
  /** 仅官方内容（系统应用维度传） */
  official?: boolean;
  /** 只返回空间的组件（团队空间维度传） */
  justReturnSpaceData?: boolean;
  /** 空间 ID（团队空间维度选中具体空间时传） */
  spaceId?: number;
  /** 页码，从 1 开始 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 分类名称（空=全部不传） */
  category?: string;
  /** 关键字搜索（空不传） */
  kw?: string;
}): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/app/list', {
    method: 'POST',
    data,
  });
}

// 广场-智能体与插件分类
export async function apiPublishedCategoryList(): Promise<
  RequestResponse<SquareCategoryInfo[]>
> {
  return request('/api/published/category/list', {
    method: 'GET',
  });
}

/**
 * 对话框智能体(ChatBox)分类列表:已发布分类接口中 type=ChatBox 根节点的 children。
 * 首页会话框分类 pill 与系统管理-推荐管理「对话框智能体」下拉同源。
 */
export async function fetchChatboxCategories(): Promise<SquareCategoryInfo[]> {
  const res = await apiPublishedCategoryList();
  if (!res.success) return [];
  const chatboxRoot = (res.data || []).find(
    (item) => String(item.type) === CategoryTypeEnum.ChatBox,
  );
  return chatboxRoot?.children || [];
}

// 广场-收藏工作流接口
export async function apiPublishedWorkflowCollect(
  workflowId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/workflow/collect/${workflowId}`, {
    method: 'POST',
  });
}

// 广场-取消收藏工作流接口
export async function apiPublishedWorkflowUnCollect(
  workflowId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/workflow/unCollect/${workflowId}`, {
    method: 'POST',
  });
}

// 广场-收藏技能接口
export async function apiPublishedSkillCollect(
  skillId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/skill/collect/${skillId}`, {
    method: 'POST',
  });
}

// 广场-取消收藏技能接口
export async function apiPublishedSkillUnCollect(
  skillId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/skill/unCollect/${skillId}`, {
    method: 'POST',
  });
}

// 广场-已发布模板列表接口
export async function apiPublishedTemplateList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/template/list', {
    method: 'POST',
    data,
  });
}

// 广场-已发布技能列表接口
export async function apiPublishedSkillList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/skill/list', {
    method: 'POST',
    data,
  });
}

// 广场-启用技能接口（能力弹窗技能卡开关，skillId 为技能本体 ID）
export async function apiPublishedSkillEnable(
  skillId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/skill/enable/${skillId}`, {
    method: 'POST',
  });
}

// 广场-取消启用技能接口
export async function apiPublishedSkillUnEnable(
  skillId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/skill/unEnable/${skillId}`, {
    method: 'POST',
  });
}

// 广场-已启用的技能列表接口（返回全量数组，非分页）
export async function apiPublishedSkillEnableList(
  data: Partial<SquarePublishedListParams> = {},
): Promise<RequestResponse<SquarePublishedItemInfo[]>> {
  return request('/api/published/skill/enable/list', {
    method: 'POST',
    data,
  });
}
