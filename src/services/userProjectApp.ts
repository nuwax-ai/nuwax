/**
 * 用户项目 / 全栈应用基础接口（共享层）
 * @description 下沉自 pages/AppDevPro/services/appDevPro：首页侧栏项目面板等
 * 非页面层消费方需要（分层红线：非页面层禁止依赖 @/pages/**）；
 * 页面层原路径再导出保持既有引用不变。
 */

import type { RequestResponse } from '@/types/interfaces/request';
import type {
  UpdateUserAppParams,
  UpdateUserProjectParams,
  UserAppInfo,
  UserProjectItem,
  UserProjectPageQueryParams,
  UserProjectTabPageResult,
} from '@/types/interfaces/userProject';
import { request } from 'umi';

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
