import { Page, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import { SkillInfoForAt, SkillListForAtParams } from './types';

// 已收藏的技能列表接口
export async function apiSkillCollectListForAt(
  data: SkillListForAtParams,
): Promise<RequestResponse<SkillInfoForAt[]>> {
  return request('/api/published/skill/collect/list', {
    method: 'POST',
    data,
  });
}

// 最近使用的技能列表
export async function apiSkillRecentlyUsedListForAt(
  data: SkillListForAtParams,
): Promise<RequestResponse<SkillInfoForAt[]>> {
  return request('/api/published/skill/recentlyUsed/list', {
    method: 'POST',
    data,
  });
}

// 查询技能列表-用于@技能
export async function apiSkillListForAt(
  data: SkillListForAtParams,
): Promise<RequestResponse<Page<SkillInfoForAt>>> {
  return request('/api/published/skill/list-for-at', {
    method: 'POST',
    data,
  });
}
