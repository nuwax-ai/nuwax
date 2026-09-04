import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/** 应用域名类型 */
export enum UserAppDomainTypeEnum {
  Default = 'Default',
  Custom = 'Custom',
}

/** 应用绑定的域名 */
export interface UserAppDomainInfo {
  /** 记录 ID */
  id: number;
  /** 商户 ID */
  tenantId: number;
  /** 应用 ID */
  appId: number;
  /** 域名 */
  domain: string;
  /** 域名类型 */
  domainType: UserAppDomainTypeEnum;
  /** 创建时间 */
  created: string;
  /** 更新时间 */
  modified: string;
}

/** 绑定自有域名参数 */
export interface UserAppDomainCreateParams {
  /** 应用 ID */
  appId: number;
  /** 域名 */
  domain: string;
}

/** 更新应用绑定的域名参数 */
export interface UserAppDomainUpdateParams {
  /** 记录 ID */
  id: number;
  /** 域名 */
  domain: string;
}

/** 查询应用绑定的域名列表 */
export async function apiUserAppDomainList(
  appId: number,
): Promise<RequestResponse<UserAppDomainInfo[]>> {
  return request('/api/userapp/domain/list', {
    method: 'GET',
    params: {
      appId,
    },
  });
}

/** 绑定自有域名 */
export async function apiUserAppDomainCreate(data: UserAppDomainCreateParams): Promise<RequestResponse<UserAppDomainInfo>> {
  return request('/api/userapp/domain/create', {
    method: 'POST',
    data,
  });
}

// 换绑域名
export async function apiUserAppDomainUpdate(data: UserAppDomainUpdateParams): Promise<RequestResponse<UserAppDomainInfo>> {
  return request('/api/userapp/domain/update', {
    method: 'POST',
    data,
  });
}

// 解绑域名
export async function apiUserAppDomainDelete(id: number): Promise<RequestResponse<null>> {
  return request('/api/userapp/domain/delete', {
    method: 'POST',
    data: {
      id,
    },
  });
}