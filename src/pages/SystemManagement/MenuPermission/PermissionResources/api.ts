import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type {
  AddResourceParams,
  GetResourceListParams,
  ResourceInfo,
  ResourceTreeNode,
  UpdateResourceParams,
} from './type';

/**
 * 添加权限资源
 */
export async function apiAddResource(
  data: AddResourceParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/resource/add', {
    method: 'POST',
    data,
  });
}

/**
 * 更新权限资源
 */
export async function apiUpdateResource(
  data: UpdateResourceParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/resource/update', {
    method: 'POST',
    data,
  });
}

/**
 * 删除权限资源
 */
export async function apiDeleteResource(
  resourceId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/delete/${resourceId}`, {
    method: 'POST',
  });
}

/**
 * 根据ID查询权限资源
 */
export async function apiGetResourceById(
  resourceId: number,
): Promise<RequestResponse<ResourceInfo>> {
  return request(`/api/system/resource/${resourceId}`, {
    method: 'GET',
  });
}

/**
 * 根据条件查询权限资源列表（树形结构）
 */
export async function apiGetResourceList(
  data?: GetResourceListParams,
): Promise<RequestResponse<ResourceTreeNode[]>> {
  return request('/api/system/resource/list', {
    method: 'GET',
    params: data,
  });
}

/**
 * 根据编码查询资源
 */
export async function apiGetResourceTree(
  resourceCode: string,
): Promise<RequestResponse<ResourceInfo>> {
  return request(`/api/system/resource/code/${resourceCode}`, {
    method: 'GET',
  });
}
