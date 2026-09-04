import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type {
  CreateUserAppParams,
  UpdateUserAppParams,
  UserAppDevTaskInfo,
  UserAppInfo,
  UserAppStartDevParams,
  UserProjectPageQueryParams,
} from '../type';

/** 用户项目（包括常规项目、全栈应用、网页应用）分页查询 */
export async function apiUserProjectPageQuery(
  data: UserProjectPageQueryParams,
): Promise<RequestResponse<any>> {
  return request('/api/user-project/page-query', {
    method: 'POST',
    data,
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

/** 创建全栈应用 */
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

/** 任务进度 SSE（dev-start、dev-restart、build 共用） */
export async function apiUserAppBuildLogsStream(
  taskId: string,
  fromSeq?: number,
): Promise<RequestResponse<null>> {
  return request(`/api/userapp/tasks/${taskId}/logs/stream`, {
    method: 'GET',
    params: {
      fromSeq,
    },
  });
}

/** 生产部署（要求发布审核通过） */
export async function apiUserAppProdStart(
  data: UserAppStartDevParams,
): Promise<RequestResponse<null>> {
  return request('/api/userapp/prod/start', {
    method: 'POST',
    data,
  });
}

/** 生产重启 */
export async function apiUserAppProdRestart(
  data: UserAppStartDevParams,
): Promise<RequestResponse<null>> {
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