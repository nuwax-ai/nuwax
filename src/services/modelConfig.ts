// 模型配置相关接口
import { request } from 'umi';
import type { RequestResponse } from '@/types/interfaces/request';
import type { ModelSaveParams, ModelListParams, ModelConfigInfo, ModelTestInfo } from '@/types/interfaces/model';

// 在空间中添加或更新模型配置接口
export async function apiModelSave(
  data: ModelSaveParams,
): Promise<RequestResponse<null>> {
  return request('/api/model/save', {
    method: 'POST',
    data,
  });
}

// 查询可使用模型列表接口
export async function apiModelList(
  data: ModelListParams,
): Promise<RequestResponse<ModelConfigInfo[]>> {
  return request('/api/model/list', {
    method: 'POST',
    data,
  });
}

// 查询指定空间下模型列表接口
export async function apiModelListSpace(spaceId: string): Promise<RequestResponse<ModelConfigInfo[]>> {
  return request(`/api/model/list/space/${spaceId}`, {
    method: 'POST',
  });
}

// 查询指定模型配置信息
export async function apiModelInfo(modelId: string): Promise<RequestResponse<ModelConfigInfo>> {
  return request(`/api/model/${modelId}`, {
    method: 'GET',
  });
}

// 删除指定模型配置信息
export async function apiModelDelete(modelId: string): Promise<RequestResponse<null>> {
  return request(`/api/model/${modelId}/delete`, {
    method: 'GET',
  });
}

// 测试执行
export async function apiModelTest(): Promise<RequestResponse<ModelTestInfo[]>> {
  return request('/api/model/test', {
    method: 'GET',
  });
}