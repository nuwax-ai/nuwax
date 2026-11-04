import { dict } from '@/services/i18nRuntime';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  CreateSpaceInviteParams,
  SpaceInvite,
  SpaceInviteInfo,
} from '@/types/interfaces/spaceInvite';
import { getSpaceInviteQrPath } from '@/utils/spaceInvite';
import { request } from 'umi';

export const apiCreateSpaceInvite = (
  data: CreateSpaceInviteParams,
): Promise<RequestResponse<SpaceInvite>> =>
  request('/api/space/invite/create', { method: 'POST', data });

export const apiListSpaceInvites = (
  spaceId: number,
): Promise<RequestResponse<SpaceInvite[]>> =>
  request(`/api/space/invite/list/${spaceId}`, { method: 'GET' });

export const apiDisableSpaceInvite = (
  inviteId: number,
): Promise<RequestResponse<null>> =>
  request(`/api/space/invite/disable/${inviteId}`, { method: 'POST' });

// 落地页自行处理登录回跳，避免统一鉴权把邀请码替换成历史栈偏移。
export const apiGetSpaceInviteInfo = (
  code: string,
): Promise<RequestResponse<SpaceInviteInfo>> =>
  request(`/api/space/invite/info/${encodeURIComponent(code)}`, {
    method: 'GET',
    skipErrorHandler: true,
  });

export const apiJoinSpaceInvite = (
  code: string,
): Promise<RequestResponse<null>> =>
  request(`/api/space/invite/join/${encodeURIComponent(code)}`, {
    method: 'POST',
    skipErrorHandler: true,
  });

export async function apiGetSpaceInviteQr(inviteUrl: string): Promise<Blob> {
  const blob: Blob = await request(getSpaceInviteQrPath(inviteUrl), {
    method: 'GET',
    responseType: 'blob',
  });
  // 当前接口未声明 Content-Type，且鉴权失败可能以 HTTP 200 返回 JSON。
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  if (png.every((value, index) => bytes[index] === value)) {
    return new Blob([blob], { type: 'image/png' });
  }
  let errorMessage = dict('PC.Pages.SpaceInvite.qrFailed');
  try {
    const data = JSON.parse(await blob.text());
    if (typeof data.message === 'string' && data.message)
      errorMessage = data.message;
  } catch {
    // 非图片、非业务 JSON 的网关响应使用统一失败提示。
  }
  throw new Error(errorMessage);
}
