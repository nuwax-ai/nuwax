import type {
  PageRecommendNum,
  RequestResponse,
} from '@/types/interfaces/request';
import { request } from 'umi';
import {
  DisplayRecommendInfo,
  DisplayRecommendListParams,
  DisplayRecommendParams,
  UpdateDisplayRecommendSortParams,
} from '../types';

/**
 * 编辑推荐
 */
export async function apiSystemUpdateDisplayRecommend(
  data: DisplayRecommendParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/display/recommend/update', {
    method: 'POST',
    data,
  });
}

/**
 * 更新排序
 */
export async function apiSystemUpdateDisplayRecommendSort(
  data: UpdateDisplayRecommendSortParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/display/recommend/updateSort', {
    method: 'POST',
    data,
  });
}

/**
 * 新增推荐
 */
export async function apiSystemSaveDisplayRecommend(
  data: DisplayRecommendParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/display/recommend/save', {
    method: 'POST',
    data,
  });
}

/**
 * 查询推荐列表
 */
export async function apiSystemGetDisplayRecommendList(
  data: DisplayRecommendListParams,
): Promise<RequestResponse<PageRecommendNum<DisplayRecommendInfo>>> {
  return request('/api/system/display/recommend/list', {
    method: 'POST',
    data,
  });
}

/**
 * 删除推荐
 */
export async function apiSystemDeleteDisplayRecommend(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/display/recommend/delete/${id}`, {
    method: 'POST',
  });
}
