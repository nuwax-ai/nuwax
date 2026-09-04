import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/** 环境：dev 开发环境；prod 发布环境 */
export enum UserAppDbEnvEnum {
  Dev = 'dev',
  Prod = 'prod',
}

export interface UserAppDbCredentialInfo {
  /** 数据库账号 */
  username: string;
  /** 数据库密码 */
  password: string;
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
): Promise<RequestResponse<UserAppDbCredentialInfo>> {
  return request('/api/userapp/save-db-credential', {
    method: 'POST',
    data,
  });
}

/** 随机生成数据库账号或密码（type=username-password，仅生成返回不落库，保存另调 save-db-credential） */
export async function apiUserAppDbCredentialGen(
  id: number,
  type: string,
): Promise<RequestResponse<UserAppDbCredentialInfo>> {
  return request(`/api/userapp/gen-db-credential/${id}`, {
    method: 'GET',
    params: {
      type,
    },
  });
}