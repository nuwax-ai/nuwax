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
  params: SkillImportParams,
): Promise<RequestResponse<number>> {
  const { file, targetSkillId, targetSpaceId } = params;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetSkillId', targetSkillId);
  formData.append('targetSpaceId', targetSpaceId);

  return request('/api/skill/import', {
    method: 'POST',
    data: formData,
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
