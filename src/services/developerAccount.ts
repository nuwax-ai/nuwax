import type {
  DeveloperAccount,
  DeveloperAccountResponse,
} from '@/types/interfaces/developerAccount';
import { request } from 'umi';

/**
 * 查询当前登录用户的开发者账户信息
 */
export async function apiGetDeveloperAccountCurrent(): Promise<DeveloperAccountResponse> {
  return request('/api/pay/developer-account/current', {
    method: 'POST',
  });
}

/**
 * 保存/更新开发者账户信息
 */
export async function apiSaveDeveloperAccount(
  data: DeveloperAccount,
): Promise<DeveloperAccountResponse> {
  return request('/api/pay/developer-account/save', {
    method: 'POST',
    data,
  });
}
