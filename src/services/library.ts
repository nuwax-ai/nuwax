import type {
  AddWorkflowParams,
  UpdateWorkflowParams,
} from '@/types/interfaces/library';
import { ComponentInfo } from '@/types/interfaces/library';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 添加工作流
export async function apiAddWorkflow(
  body: AddWorkflowParams,
): Promise<RequestResponse<null>> {
  return request('/api/workflow/add', {
    method: 'POST',
    data: body,
  });
}

// 更新工作流
export async function apiUpdateWorkflow(
  body: UpdateWorkflowParams,
): Promise<RequestResponse<null>> {
  return request('/api/workflow/update', {
    method: 'POST',
    data: body,
  });
}

// 查询组件列表接口
export async function apiComponentList(
  spaceId: string,
): Promise<RequestResponse<ComponentInfo[]>> {
  return request(`/api/component/list/${spaceId}`, {
    method: 'GET',
  });
}
