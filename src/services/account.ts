import type {
  BindEmailParams,
  CodeLogin,
  ILoginResult,
  LoginFieldType,
  ResetPasswordParams,
  SendCode,
  SetPasswordParams,
  TenantConfigInfo,
  UserInfo,
  UserUpdateParams,
} from '@/types/interfaces/login';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import { clearLoginStatusCache } from './userService';

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
  clearLoginStatusCache();
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
export async function apiTenantConfig(): Promise<
  RequestResponse<TenantConfigInfo>
> {
  return request('/api/tenant/config', {
    method: 'GET',
  });
}

// 获取当前登录用户的动态认证码
export async function apiGetUserDynamicCode(): Promise<
  RequestResponse<number>
> {
  return request('/api/user/dynamicCode', {
    method: 'GET',
  });
}

// 用量使用情况
export interface UsageInfo {
  /** 限制 */
  limit: string;
  /** 使用情况 */
  usage: string;
  /** 使用情况 */
  description: string;
}

// 用户用量统计信息
export interface UserMetricUsageInfo {
  /** 今日token使用情况 */
  todayTokenUsage: UsageInfo;
  /** 今日智能体对话次数使用情况 */
  todayAgentPromptUsage: UsageInfo;
  /** 今日页面应用对话次数使用情况 */
  todayPageAppPromptUsage: UsageInfo;
  /** 今日工作空间使用情况 */
  newWorkspaceUsage: UsageInfo;
  /** 今日智能体使用情况 */
  newAgentUsage: UsageInfo;
  /** 今日页面应用使用情况 */
  newPageAppUsage: UsageInfo;
  /** 今日知识库使用情况 */
  newKnowledgeBaseUsage: UsageInfo;
  /** 知识库存储空间使用情况 */
  knowledgeBaseStorageUsage: UsageInfo;
  /** 今日数据表使用情况 */
  newTableUsage: UsageInfo;
  /** 今日定时任务使用情况 */
  newTaskUsage: UsageInfo;
  /** 沙盒内存限制使用情况 */
  sandboxMemoryLimit: UsageInfo;
}

// 查询用户各项已使用情况
export async function apiGetUserMetricUsage(): Promise<
  RequestResponse<UserMetricUsageInfo>
> {
  return request('/api/user/metric/usage', {
    method: 'GET',
  });
}
