import type {
  CodeLogin,
  ILoginResult,
  LoginFieldType,
  SendCode,
} from '@/types/interfaces/login';
import { SetPasswordParams } from '@/types/interfaces/login';
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
