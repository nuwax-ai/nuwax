import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 页面列表
export async function apiPageList(
  spaceId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user/page/list`, {
    method: 'POST',
    data: {
      spaceId,
    },
  });
}
