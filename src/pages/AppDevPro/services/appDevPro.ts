import type { RequestResponse } from '@/types/interfaces/request';
import { normalizeTerminalWsUrl } from '@/utils/terminalWsUrl';
import { request } from 'umi';
import type {
  CreateUserAppParams,
  CreateUserProjectParams,
  ProjectLatestConversationResult,
  UpdateUserAppParams,
  UpdateUserProjectParams,
  UserAppDevTaskInfo,
  UserAppInfo,
  UserAppLogsQueryParams,
  UserAppLogsQueryResult,
  UserAppLogsSourcesQueryParams,
  UserAppStartDevParams,
  UserProjectItem,
  UserProjectPageQueryParams,
  UserProjectPageResult,
  UserProjectTabPageResult,
} from '../type';
import { UserAppDbEnvEnum } from './appDb';

/** 用户项目（包括常规项目、全栈应用、网页应用）分页查询 */
export async function apiUserProjectPageQuery(
  data: UserProjectPageQueryParams,
): Promise<RequestResponse<UserProjectPageResult>> {
  return request('/api/user-project/page-query', {
    method: 'POST',
    data,
  });
}

/**
 * tab 项目分页查询（2026-09-08 新接口）：项目列表 + 每个项目下的会话列表，
 * 供首页侧栏「项目」Tab 使用。
 */
export async function apiUserProjectTabPageQuery(
  data: UserProjectPageQueryParams,
): Promise<RequestResponse<UserProjectTabPageResult>> {
  return request('/api/user-project/tab/page-query', {
    method: 'POST',
    data,
  });
}

/** 创建常规项目（管理端入口；首页对话框创建仍走 /api/project/create） */
export async function apiUserProjectCreate(
  data: CreateUserProjectParams,
): Promise<RequestResponse<UserProjectItem>> {
  return request('/api/user-project/create', {
    method: 'POST',
    data,
  });
}

/** 按ID查询常规项目 */
export async function apiUserProjectGetById(
  id: number,
): Promise<RequestResponse<UserProjectItem>> {
  return request(`/api/user-project/get/${id}`, {
    method: 'GET',
  });
}

/** 更新常规项目基本信息 */
export async function apiUserProjectUpdate(
  data: UpdateUserProjectParams,
): Promise<RequestResponse<UserProjectItem>> {
  return request('/api/user-project/update', {
    method: 'POST',
    data,
  });
}

/** 删除常规项目 */
export async function apiUserProjectDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user-project/delete/${id}`, {
    method: 'POST',
  });
}

/** 常规项目：获取当前用户最新会话（进项目详情无会话 id 时调用） */
export async function apiUserProjectLatestConversation(
  id: number,
): Promise<RequestResponse<ProjectLatestConversationResult>> {
  return request(`/api/user-project/conversation/${id}`, {
    method: 'GET',
  });
}

/** 全栈应用：获取当前用户最新会话（进项目详情无会话 id 时调用） */
export async function apiUserAppLatestConversation(
  id: number,
): Promise<RequestResponse<ProjectLatestConversationResult>> {
  return request(`/api/userapp/conversation/${id}`, {
    method: 'GET',
  });
}

/** 创建全栈应用 */
export async function apiUserAppCreate(
  data: CreateUserAppParams,
): Promise<RequestResponse<UserAppInfo>> {
  return request('/api/userapp/create', {
    method: 'POST',
    data,
  });
}

/** 按应用ID查询（主键 id 即 app_id） */
export async function apiUserAppGetById(
  id: number,
): Promise<RequestResponse<UserAppInfo>> {
  return request(`/api/userapp/get/${id}`, {
    method: 'GET',
  });
}

/** 更新基本信息（传 null 的字段不更新） */
export async function apiUserAppUpdate(
  data: UpdateUserAppParams,
): Promise<RequestResponse<UserAppInfo>> {
  return request('/api/userapp/update', {
    method: 'POST',
    data,
  });
}

/** 删除应用（物理删除） */
export async function apiUserAppDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/userapp/delete/${id}`, {
    method: 'POST',
  });
}

/** 启动开发容器（异步任务，返回任务行；进行中重复发起将被拒绝） */
export async function apiUserAppStartDev(
  data: UserAppStartDevParams,
): Promise<RequestResponse<UserAppDevTaskInfo>> {
  return request('/api/userapp/dev/start', {
    method: 'POST',
    data,
  });
}

/** 重启开发容器（异步任务，返回任务行；进行中重复发起将被拒绝） */
export async function apiUserAppRestartDev(
  data: UserAppStartDevParams,
): Promise<RequestResponse<UserAppDevTaskInfo>> {
  return request('/api/userapp/dev/restart', {
    method: 'POST',
    data,
  });
}

/** 停止开发容器 */
export async function apiUserAppStopDev(
  data: UserAppStartDevParams,
): Promise<RequestResponse<null>> {
  return request('/api/userapp/dev/stop', {
    method: 'POST',
    data,
  });
}

/** 构建打包（异步任务；完成后自动上传产物到文件服务并记录发布版本） */
export async function apiUserAppBuild(
  data: UserAppStartDevParams,
): Promise<RequestResponse<UserAppDevTaskInfo>> {
  return request('/api/userapp/build', {
    method: 'POST',
    data,
  });
}

/** 取消任务 */
export async function apiUserAppBuildCancel(
  taskId: string,
): Promise<RequestResponse<UserAppDevTaskInfo>> {
  return request(`/api/userapp/tasks/${taskId}/cancel`, {
    method: 'POST',
  });
}

/**
 * 任务进度 SSE 地址（实际拉流请用 fetchEventSource，不要走 umi request）
 * 任务进度 SSE（dev-start、dev-restart、build 共用）
 * @param taskId 构建任务 ID
 * @param fromSeq 断点序号
 * @returns SSE URL
 */
export const getUserAppTaskLogsStreamUrl = (
  taskId: string,
  fromSeq?: number,
): string => {
  const baseUrl = process.env.BASE_URL || '';
  const search =
    fromSeq !== undefined && fromSeq !== null ? `?fromSeq=${fromSeq}` : '';
  return `${baseUrl}/api/userapp/tasks/${encodeURIComponent(
    taskId,
  )}/logs/stream${search}`;
};

/** 生产部署（要求发布审核通过；异步任务，返回任务行） */
export async function apiUserAppProdStart(
  data: UserAppStartDevParams,
): Promise<RequestResponse<UserAppDevTaskInfo>> {
  return request('/api/userapp/prod/start', {
    method: 'POST',
    data,
  });
}

/** 生产重启（异步任务，返回任务行） */
export async function apiUserAppProdRestart(
  data: UserAppStartDevParams,
): Promise<RequestResponse<UserAppDevTaskInfo>> {
  return request('/api/userapp/prod/restart', {
    method: 'POST',
    data,
  });
}

/** 生产停止 */
export async function apiUserAppProdStop(
  data: UserAppStartDevParams,
): Promise<RequestResponse<null>> {
  return request('/api/userapp/prod/stop', {
    method: 'POST',
    data,
  });
}

/** 查询应用日志 */
export async function apiUserAppLogsQuery(
  data: UserAppLogsQueryParams,
): Promise<RequestResponse<UserAppLogsQueryResult>> {
  return request('/api/userapp/logs/query', {
    method: 'POST',
    data,
  });
}

/** 查询应用日志来源 */
export async function apiUserAppLogsSourcesQuery(
  data: UserAppLogsSourcesQueryParams,
): Promise<RequestResponse<UserAppLogsQueryResult>> {
  return request('/api/userapp/logs/sources/query', {
    method: 'POST',
    data,
  });
}

/**
 * 开发环境远程桌面代理地址（iframe）
 * /api/userapp/proxy/vnc/dev/{appId}/
 *
 * @param appId 应用 ID
 * @returns 可嵌入 iframe 的绝对或相对地址
 */
export const getUserAppVncProxyUrl = (appId: number): string => {
  const path = `/api/userapp/proxy/vnc/dev/${appId}/`;
  const baseUrl = process.env.BASE_URL || '';
  return `${baseUrl}${path}`;
};

/**
 * 全栈应用终端 ttyd 代理 WebSocket 地址
 * 开发环境：/api/userapp/proxy/ttyd/dev/{appId}
 * 线上环境：/api/userapp/proxy/ttyd/prod/{appId}
 *
 * @param appId 应用 ID
 * @param env 当前环境（开发 / 线上）
 * @returns 终端 WebSocket 地址；缺少 appId 时返回空字符串
 */
export const getUserAppTtydProxyWsUrl = (
  appId: number,
  env: UserAppDbEnvEnum,
): string => {
  if (!appId) {
    return '';
  }

  const path = `/api/userapp/proxy/ttyd/${env}/${appId}`;
  const baseUrl = process.env.BASE_URL || '';

  if (typeof window !== 'undefined') {
    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      return normalizeTerminalWsUrl(`${baseUrl}${path}`);
    }
    return normalizeTerminalWsUrl(`${wsScheme}://${host}${baseUrl}${path}`);
  }

  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return normalizeTerminalWsUrl(`${baseUrl}${path}`);
  }
  return '';
};
