/**
 * 用户项目 / 全栈应用基础接口（共享层）
 * @description 下沉自 pages/AppDevPro/services/appDevPro：首页侧栏项目面板等
 * 非页面层消费方需要（分层红线：非页面层禁止依赖 @/pages/**）；
 * 页面层原路径再导出保持既有引用不变。
 */

import type { RequestResponse } from '@/types/interfaces/request';
import type {
  ProjectLatestConversationResult,
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

/**
 * 更新常规项目基本信息（wiki 2026-09-11：常规项目 CRUD 换 /api/normal-project/*，
 * 管理端/侧栏的改名走本接口；入参语义与 user-project/update 一致）
 */
export async function apiNormalProjectUpdate(
  data: UpdateUserProjectParams,
): Promise<RequestResponse<UserProjectItem>> {
  return request('/api/normal-project/update', {
    method: 'POST',
    data,
  });
}

/** 删除常规项目（wiki 2026-09-11 新契约） */
export async function apiNormalProjectDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/normal-project/delete/${id}`, {
    method: 'POST',
  });
}

/** 按ID查询常规项目（wiki 2026-09-11 新契约；响应结构未细化，防御式消费） */
export async function apiNormalProjectGetById(
  id: number,
): Promise<RequestResponse<UserProjectItem>> {
  return request(`/api/normal-project/get/${id}`, {
    method: 'GET',
  });
}

/**
 * 常规项目：获取当前用户最新会话（进项目详情无会话 id 时调用，
 * wiki 2026-09-11 新契约；返回体复用 ProjectLatestConversationResult
 * 防御式取 conversationId/id/agentId）
 */
export async function apiNormalProjectLatestConversation(
  id: number,
): Promise<RequestResponse<ProjectLatestConversationResult>> {
  return request(`/api/normal-project/conversation/${id}`, {
    method: 'GET',
  });
}

/** 项目置顶/取消置顶（wiki 2026-09-11 新契约，同一路径幂等切换） */
export async function apiUserProjectPin(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user-project/pin/${id}`, {
    method: 'POST',
  });
}

/** 项目归档/取消归档（wiki 2026-09-11 新契约，同一路径幂等切换） */
export async function apiUserProjectArchive(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user-project/archive/${id}`, {
    method: 'POST',
  });
}
