import type {
  NotifyMessageInfo,
  NotifyMessageListParams,
} from '@/types/interfaces/message';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 更新指定未读消息为已读
export async function apiNotifyMessageRead(
  data: number[],
): Promise<RequestResponse<null>> {
  return request('/api/notify/message/read', {
    method: 'POST',
    data,
  });
}

// 查询用户消息列表
export async function apiNotifyMessageList(
  data: NotifyMessageListParams,
): Promise<RequestResponse<NotifyMessageInfo[]>> {
  return request('/api/notify/message/list', {
    method: 'POST',
    data,
  });
}

// 查询用户未读消息数量
export async function apiNotifyMessageUnreadCount(): Promise<
  RequestResponse<null>
> {
  return request('/api/notify/message/unread/count', {
    method: 'GET',
  });
}

// 清除所有未读消息
export async function apiNotifyMessageUnreadClear(): Promise<
  RequestResponse<null>
> {
  return request('/api/notify/message/unread/clear', {
    method: 'GET',
  });
}
