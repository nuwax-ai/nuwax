import type {
  AddIMChannelParams,
  IMChannelInfo,
} from '@/types/interfaces/imChannel';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * 查询 IM 渠道配置列表
 */
export async function apiIMConfigChannelList(data: {
  channel: string;
  spaceId?: number;
}): Promise<RequestResponse<IMChannelInfo[]>> {
  return request('/api/im-config/channel/list', {
    method: 'POST',
    data,
  });
}

/**
 * 添加 IM 渠道配置
 */
export async function apiAddIMConfigChannel(
  data: AddIMChannelParams,
): Promise<RequestResponse<any>> {
  return request('/api/im-config/channel/add', {
    method: 'POST',
    data,
  });
}
/**
 * 修改 IM 渠道配置
 */
export async function apiUpdateIMConfigChannel(
  data: AddIMChannelParams,
): Promise<RequestResponse<any>> {
  return request('/api/im-config/channel/update', {
    method: 'POST',
    data,
  });
}

/**
 * 查询 IM 渠道配置详情
 */
export async function apiGetIMConfigChannelDetail(
  id: number,
): Promise<RequestResponse<IMChannelInfo>> {
  return request(`/api/im-config/channel/detail/${id}`, {
    method: 'GET',
  });
}

/**
 * 启用-禁用 IM 渠道配置
 */
export async function apiUpdateIMConfigChannelEnabled(data: {
  id: number;
  enabled: boolean;
}): Promise<RequestResponse<any>> {
  return request('/api/im-config/channel/updateEnabled', {
    method: 'POST',
    data,
  });
}
/**
 * 测试 IM 渠道配置连通性
 */
export async function apiTestIMConfigChannelConnection(data: {
  channel: string;
  targetType: string;
  configData: string;
}): Promise<
  RequestResponse<{ success: boolean; message: string; detail: string }>
> {
  return request('/api/im-config/channel/testConnection', {
    method: 'POST',
    data,
  });
}
/**
 * 删除 IM 渠道配置
 */
export async function apiDeleteIMConfigChannel(
  id: number,
): Promise<RequestResponse<any>> {
  return request(`/api/im-config/channel/delete/${id}`, {
    method: 'POST',
  });
}
/**
 * 统计 IM 渠道配置
 */
export async function apiIMConfigChannelStatistics(data: {
  spaceId: number;
}): Promise<
  RequestResponse<{ channel: string; channelName: string; count: number }[]>
> {
  return request('/api/im-config/channel/statistics', {
    method: 'POST',
    data,
  });
}
