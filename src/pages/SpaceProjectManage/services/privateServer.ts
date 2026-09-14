import { request } from "umi";
import { RequestResponse } from "@/types/interfaces/request";

/** 登记私有部署服务器参数 */
export interface PrivateServerCreateParams {
  /** 记录 ID，更新时传入 */
  id?: number;
  /** 服务器名称 */
  name?: string;
  /** 访问协议，如 http / https */
  scheme?: string;
  /** 服务器地址 */
  host?: string;
  /** 管理端口 */
  agentPort?: number;
  /** 应用端口 */
  appPort?: number;
}

/** 私有部署服务器信息 */
export interface PrivateServerInfo {
  /** 记录 ID */
  id: number;
  /** 服务器名称 */
  name: string;
  /** 访问协议 */
  scheme: string;
  /** 服务器地址 */
  host: string;
  /** 管理端口 */
  agentPort: number;
  /** 应用端口 */
  appPort: number;
  /** 接入密钥 */
  apiKey: string;
  /** 健康状态 */
  status: string;
  /** 版本 */
  version: string;
  /** 最近健康检查时间 */
  lastHealthCheck: string;
  /** 创建时间 */
  created: string;
  /** 更新时间 */
  modified: string;
}

/** 登记私有部署服务器 */
export async function apiPrivateServerCreate(
  data: PrivateServerCreateParams,
): Promise<RequestResponse<PrivateServerInfo>> {
  return request('/api/userapp/private-server/create', {
    method: 'POST',
    data,
  });
}

// 更新私有部署服务器参数
export type PrivateServerUpdateParams = PrivateServerCreateParams;

/** 更新私服信息（变更地址-端口将回到待就绪状态，需重新健康检查通过） */
export async function apiPrivateServerUpdate(
  data: PrivateServerUpdateParams,
): Promise<RequestResponse<PrivateServerInfo>> {
  return request('/api/userapp/private-server/update', {
    method: 'POST',
    data,
  });
}

/** 删除私服（仍被应用引用时拒绝） */
export async function apiPrivateServerDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request('/api/userapp/private-server/delete', {
    method: 'POST',
    data: { id },
  });
}

/** 我的私服列表 */
export async function apiPrivateServerList(): Promise<RequestResponse<PrivateServerInfo[]>> {
  return request('/api/userapp/private-server/list', {
    method: 'GET',
  });
}

/** 私服详情（属主可见 apiKey）*/
export async function apiPrivateServerGet(
  id: number,
): Promise<RequestResponse<PrivateServerInfo>> {
  return request('/api/userapp/private-server/get', {
    method: 'GET',
    data: { id },
  });
}

/** 健康检查（指定私服，仅检查地址是否可达） */
export async function apiPrivateServerHealthCheck(
  id: number,
): Promise<RequestResponse<boolean>> {
  return request('/api/userapp/private-server/health-check', {
    method: 'POST',
    data: { id },
  });
}