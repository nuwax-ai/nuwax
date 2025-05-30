import type {
  AddWorkflowParams,
  ComponentInfo,
  CopyTableParams,
  PublishedOffShelfParams,
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

// 智能体、插件、工作流下架
export async function apiPublishedOffShelf(
  data: PublishedOffShelfParams,
): Promise<RequestResponse<null>> {
  return request('/api/published/offShelf', {
    method: 'POST',
    data,
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
