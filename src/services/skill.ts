import { RequestResponse } from '@/types/interfaces/request';
import {
  SkillDetailInfo,
  SkillImportParams,
  SkillUpdateParams,
} from '@/types/interfaces/skill';
import { request } from 'umi';

// 查询技能详情
export async function apiSkillDetail(
  skillId: number,
): Promise<RequestResponse<SkillDetailInfo>> {
  return request(`/api/skill/${skillId}`, {
    method: 'GET',
  });
}

// 修改技能
export async function apiSkillUpdate(
  data: SkillUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/skill/update', {
    method: 'POST',
    data,
  });
}

// 导入技能
export async function apiSkillImport(
  data: SkillImportParams,
): Promise<RequestResponse<number>> {
  return request('/api/skill/import', {
    method: 'POST',
    params: {
      ...data,
    },
  });
}

// 导出技能
export async function apiSkillExport(
  skillId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/skill/export/${skillId}`, {
    method: 'GET',
  });
}
