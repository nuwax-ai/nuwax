import type {
  AuthIdpInfo,
  AuthIdpLoginList,
  AuthIdpSaveParams,
  UserIdentityInfo,
} from '@/types/interfaces/authIdp';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// ==================== 管理端：登录方式管理 ====================

// 登录方式列表（config 脱敏）
export async function apiAuthIdpList(): Promise<
  RequestResponse<AuthIdpInfo[]>
> {
  return request('/api/system/idp/list', {
    method: 'GET',
  });
}

// 新增登录方式（默认停用）
export async function apiAuthIdpCreate(
  data: AuthIdpSaveParams,
): Promise<RequestResponse<AuthIdpInfo>> {
  return request('/api/system/idp/create', {
    method: 'POST',
    data,
  });
}

// 编辑登录方式（类型不可变更；secret 不传表示不修改）
export async function apiAuthIdpUpdate(
  data: AuthIdpSaveParams,
): Promise<RequestResponse<AuthIdpInfo>> {
  return request('/api/system/idp/update', {
    method: 'POST',
    data,
  });
}

// 启用 / 停用（停用联动取消未登录自动跳转）
export async function apiAuthIdpUpdateStatus(data: {
  id: number;
  enabled: number;
}): Promise<RequestResponse<null>> {
  return request('/api/system/idp/updateStatus', {
    method: 'POST',
    data,
  });
}

// 设置 / 取消未登录自动跳转（id 为 null 表示取消；租户内唯一）
export async function apiAuthIdpAutoRedirect(data: {
  id: number | null;
}): Promise<RequestResponse<null>> {
  return request('/api/system/idp/auto-redirect', {
    method: 'POST',
    data,
  });
}

// 删除登录方式（仍有用户绑定时后端拒绝）
export async function apiAuthIdpDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/idp/delete/${id}`, {
    method: 'POST',
  });
}

// ==================== 登录页 / 账号绑定 ====================

// 登录页可用的三方登录方式（免登录）；失败静默，由调用方回落普通登录
export async function apiAuthIdpLoginList(): Promise<
  RequestResponse<AuthIdpLoginList>
> {
  return request('/api/auth/idp/list', {
    method: 'GET',
    skipErrorHandler: true,
  });
}

// 我绑定的外部身份
export async function apiUserIdentityList(): Promise<
  RequestResponse<UserIdentityInfo[]>
> {
  return request('/api/user/identity/list', {
    method: 'GET',
  });
}

// 解绑（唯一登录方式且未设密码时后端拒绝）
export async function apiUserIdentityUnbind(
  identityId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user/identity/unbind/${identityId}`, {
    method: 'POST',
  });
}
