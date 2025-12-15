import type {
  AddSkillParams,
  AddWorkflowParams,
  ComponentInfo,
  CopyTableParams,
  SkillInfo,
  SkillQueryFilter,
  UpdateSkillParams,
  UpdateWorkflowParams,
} from '@/types/interfaces/library';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 添加工作流
export async function apiAddWorkflow(
  data: AddWorkflowParams,
): Promise<RequestResponse<null>> {
  return request('/api/workflow/add', {
    method: 'POST',
    data,
  });
}

// 添加技能
export async function apiAddSkill(
  data: AddSkillParams,
): Promise<RequestResponse<null>> {
  return request('/api/skill/add', {
    method: 'POST',
    data,
  });
}

// 更新技能
export async function apiUpdateSkill(
  data: UpdateSkillParams,
): Promise<RequestResponse<null>> {
  return request('/api/skill/update', {
    method: 'POST',
    data,
  });
}

// 删除技能
export async function apiDeleteSkill(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/skill/delete/${id}`, {
    method: 'POST',
  });
}

// 更新工作流
export async function apiUpdateWorkflow(
  data: UpdateWorkflowParams,
): Promise<RequestResponse<null>> {
  return request('/api/workflow/update', {
    method: 'POST',
    data,
  });
}

// 工作流 - 复制工作流到空间
export async function apiWorkflowCopyToSpace(
  workflowId: number,
  targetSpaceId: number,
): Promise<RequestResponse<number>> {
  return request(`/api/workflow/copy/${workflowId}/${targetSpaceId}`, {
    method: 'POST',
  });
}

// 工作流 - 删除工作流接口
export async function apiWorkflowDelete(
  workflowId: number,
): Promise<RequestResponse<number>> {
  return request(`/api/workflow/delete/${workflowId}`, {
    method: 'POST',
  });
}

// 查询组件列表接口
export async function apiComponentList(
  spaceId: number,
): Promise<RequestResponse<ComponentInfo[]>> {
  return request(`/api/component/list/${spaceId}`, {
    method: 'GET',
  });
}

// 查询技能列表接口
export async function apiSkillList(
  queryFilter: SkillQueryFilter,
): Promise<RequestResponse<SkillInfo[]>> {
  return request(`/api/skill/list`, {
    method: 'GET',
    params: queryFilter,
  });
}

// 数据表复制(请求类型 - query)
export function apiCopyTable(
  data: CopyTableParams,
): Promise<RequestResponse<number>> {
  return request('/api/compose/db/table/copyTableDefinition', {
    method: 'POST',
    params: data,
  });
}
