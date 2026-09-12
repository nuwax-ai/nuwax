import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/** 环境：dev 开发环境；prod 发布环境 */
export enum UserAppDbEnvEnum {
  Dev = 'dev',
  Prod = 'prod',
}

export interface UserAppDbCredentialInfo {
  /** 数据库账号 */
  username: string | null;
  /** 数据库密码 */
  password: string | null;
}

/** 保存数据库账号密码参数 */
export interface UserAppDbCredentialSaveParams {
  /** 应用 ID */
  id: number;
  /** 环境：dev 开发环境；prod 发布环境 */
  env: UserAppDbEnvEnum;
  /** 数据库账号 */
  username: string;
  /** 数据库密码（明文入参，服务端加密存储） */
  password: string;
}

/** 查询数据库账号密码（解密返回明文，未设置返回 null） */
export async function apiUserAppDbCredentialGet(
  id: number,
  env: string,
): Promise<RequestResponse<UserAppDbCredentialInfo>> {
  return request(`/api/userapp/db-credential/${id}`, {
    method: 'GET',
    params: {
      env,
    },
  });
}

/** 保存数据库账号密码（同步重置沙箱数据库密码，下游结果返回给前端） */
export async function apiUserAppDbCredentialSave(
  data: UserAppDbCredentialSaveParams,
): Promise<RequestResponse<string>> {
  return request('/api/userapp/save-db-credential', {
    method: 'POST',
    data,
  });
}

/** 随机生成数据库账号或密码（type=username 或 password，仅生成返回不落库） */
export async function apiUserAppDbCredentialGen(
  id: number,
  type: string,
): Promise<RequestResponse<string>> {
  return request(`/api/userapp/gen-db-credential/${id}`, {
    method: 'GET',
    params: {
      type,
    },
  });
}

/**
 * 数据库管理页代理地址（iframe）
 * 开发环境：/api/userapp/proxy/dbx/dev/{appId}/
 * 线上环境：/api/userapp/proxy/dbx/prod/{appId}/
 *
 * @param appId 应用 ID
 * @param env 环境
 * @returns 可嵌入 iframe 的绝对或相对地址
 */
export const getUserAppDbProxyUrl = (
  appId: number,
  env: UserAppDbEnvEnum,
): string => {
  const path = `/api/userapp/proxy/dbx/${env}/${appId}/`;
  const baseUrl = process.env.BASE_URL || '';
  return `${baseUrl}${path}`;
};
