import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  AddSystemUserParams,
  ModelConfigDto,
  PublishedDto,
  SystemUserConfig,
  SystemUserListInfo,
  SystemUserListParams,
  TenantConfigDto,
  UpdateSystemUserParams,
  UploadResultDto,
} from '@/types/interfaces/systemManage';
import { request } from 'umi';

// 查询用户列表
export async function apiSystemUserList(
  data: SystemUserListParams,
): Promise<RequestResponse<Page<SystemUserListInfo>>> {
  return request('/api/system/user/list', {
    method: 'POST',
    data,
  });
}

// 新增用户
export async function apiAddSystemUser(
  data: AddSystemUserParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/user/add', {
    method: 'POST',
    data,
  });
}

// 更新用户
export async function apiUpdateSystemUser(
  data: UpdateSystemUserParams,
): Promise<RequestResponse<null>> {
  return request(`/api/system/user/updateById/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 启用用户
export async function apiEnableSystemUser(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/user/enable/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 启用用户
export async function apiDisableSystemUser(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/user/disable/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 查询用户列表
// 查询系统设置列表
export async function apiSystemConfigList(): Promise<
  RequestResponse<SystemUserConfig[]>
> {
  return request('/api/system/config/list', {
    method: 'POST',
  });
}
// 查询模型列表
export async function apiSystemModelList(): Promise<
  RequestResponse<ModelConfigDto[]>
> {
  return request('/api/system/model/list', {
    method: 'GET',
  });
}
// 查询可选模型列表
export async function apiUseableModelList(): Promise<
  RequestResponse<ModelConfigDto[]>
> {
  return request('/api/model/list', {
    method: 'POST',
    data: {},
  });
}
// 查询可选择的智能体列表
export async function apiSystemAgentList(
  kw: string,
): Promise<RequestResponse<PublishedDto[]>> {
  return request('/api/system/publish/agent/list', {
    method: 'POST',
    data: { kw },
  });
}
// 上传文件
export async function apiSystemUploadFile(
  file: File,
): Promise<RequestResponse<UploadResultDto>> {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/file/upload', {
    method: 'POST',
    data: formData,
  });
}
// 更新配置信息
export async function apiSystemConfigUpdate(
  data: TenantConfigDto,
): Promise<RequestResponse<any>> {
  return request('/api/system/config/add', {
    method: 'POST',
    data,
  });
}
