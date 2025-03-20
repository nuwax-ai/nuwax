import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  SystemUserListInfo,
  SystemUserListParams,
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
