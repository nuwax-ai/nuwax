import type { DisplayRecommendListData } from '@/types/interfaces/displayRecommend';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

export async function apiDisplayRecommendList(options?: {
  skipErrorHandler?: boolean;
}): Promise<RequestResponse<DisplayRecommendListData>> {
  return request('/api/display/recommend/list', {
    method: 'GET',
    skipErrorHandler: options?.skipErrorHandler,
  });
}
