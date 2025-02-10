import type {
  BindEmailParams,
  CodeLogin,
  ILoginResult,
  LoginFieldType,
  SendCode,
  SetPasswordParams,
  UserInfo,
  UserUpdateParams,
} from '@/types/interfaces/login';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 账号密码登录
export async function apiLogin(
  body: LoginFieldType,
): Promise<RequestResponse<ILoginResult>> {
  return request('/api/user/passwordLogin', {
    method: 'POST',
    data: body,
  });
}

// 发送验证码
export async function apiSendCode(
  body: SendCode,
): Promise<RequestResponse<null>> {
  return request('/api/user/code/send', {
    method: 'POST',
    data: body,
  });
}

// 验证码登录/注册接口
export async function apiLoginCode(
  body: CodeLogin,
): Promise<RequestResponse<ILoginResult>> {
  return request('/api/user/codeLogin', {
    method: 'POST',
    data: body,
  });
}

// 首次登录设置密码
export async function apiSetPassword(
  body: SetPasswordParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/password/set', {
    method: 'POST',
    data: body,
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
  body: BindEmailParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/email/bind', {
    method: 'POST',
    data: body,
  });
}

// 更新用户信息
export async function apiUserUpdate(
  body: UserUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/update', {
    method: 'POST',
    data: body,
  });
}

// 查询当前登录用户信息
export async function apiUserInfo(): Promise<RequestResponse<UserInfo>> {
  return request('/api/user/getLoginInfo', {
    method: 'GET',
  });
}
