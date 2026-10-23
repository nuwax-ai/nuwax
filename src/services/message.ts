import type {
  NotifyMessageInfo,
  NotifyMessageListParams,
} from '@/types/interfaces/message';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * IM 通讯录行的最小取名投影（NW-094）。
 * displayName 由 IM 服务端按「备注 > 昵称 > 账号名」算好；真人 userId 与平台
 * userId 恒等，按 id 对齐通知中心 sender。
 */
export interface InstantMessageContactItem {
  userId?: number | string | null;
  displayName?: string | null;
}

/**
 * 拉取 IM 通讯录（同源 Cookie 鉴权），供通知中心解析备注优先的发送者名。
 * 尽力而为：IM 未部署/未登录等失败场景静默返回 null（skipErrorHandler 抑制
 * 全局错误弹窗），调用方回退 nickName || userName 的原有取名。
 */
export async function apiInstantMessageContacts(): Promise<
  RequestResponse<{ items?: InstantMessageContactItem[] }> | null
> {
  try {
    return await request('/api/instant-message/contacts', {
      method: 'GET',
      skipErrorHandler: true,
    });
  } catch {
    return null;
  }
}

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
