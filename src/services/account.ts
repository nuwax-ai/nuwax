import type {
  BindEmailParams,
  CodeLogin,
  ILoginResult,
  LoginFieldType,
  ResetPasswordParams,
  SendCode,
  SetPasswordParams,
  UserInfo,
  UserUpdateParams,
  TenantConfigInfo,
} from '@/types/interfaces/login';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 账号密码登录
export async function apiLogin(
  data: LoginFieldType,
): Promise<RequestResponse<ILoginResult>> {
  return request('/api/user/passwordLogin', {
    method: 'POST',
    data,
  });
}

// 发送验证码
export async function apiSendCode(
  data: SendCode,
): Promise<RequestResponse<null>> {
  return request('/api/user/code/send', {
    method: 'POST',
    data,
  });
}

// 验证码登录/注册接口
export async function apiLoginCode(
  data: CodeLogin,
): Promise<RequestResponse<ILoginResult>> {
  return request('/api/user/codeLogin', {
    method: 'POST',
    data,
  });
}

// 首次登录设置密码
export async function apiSetPassword(
  data: SetPasswordParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/password/set', {
    method: 'POST',
    data,
  });
}

// 退出登录接口
export async function apiLogout(): Promise<RequestResponse<null>> {
  return request('/api/user/logout', {
    method: 'GET',
  });
}

// 绑定邮箱
export async function apiBindEmail(
  data: BindEmailParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/email/bind', {
    method: 'POST',
    data,
  });
}

// 更新用户信息
export async function apiUserUpdate(
  data: UserUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/update', {
    method: 'POST',
    data,
  });
}

// 查询当前登录用户信息
export async function apiUserInfo(): Promise<RequestResponse<UserInfo>> {
  return request('/api/user/getLoginInfo', {
    method: 'GET',
  });
}

// 重置密码
export async function apiResetPassword(
  data: ResetPasswordParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/password/reset', {
    method: 'POST',
    data,
  });
}

// 租户配置信息查询接口
export async function apiTenantConfig(): Promise<RequestResponse<TenantConfigInfo>> {
  return request('/api/tenant/config', {
    method: 'GET',
  });
}