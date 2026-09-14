/**
 * 用户项目 / 全栈应用基础接口（共享层）
 * @description 下沉自 pages/AppDevPro/services/appDevPro：首页侧栏项目面板等
 * 非页面层消费方需要（分层红线：非页面层禁止依赖 @/pages/**）；
 * 页面层原路径再导出保持既有引用不变。
 */

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
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
 * tab 项目分页查询（2026-09-08 上线）：项目列表 + 每个项目下的会话列表。
 * ⚠️ 2026-09-14 后端契约统一：本接口已废弃（swagger 删除线），由
 * apiUserProjectPageQuery 取代——统一接口含归档项目、支持 collectedFilter，
 * 但不附带 conversations（需经 apiUserProjectConversations 懒加载）；
 * 存量消费方（首页 ProjectPanel / SidebarSearchModal / SpaceProjectManage）
 * 依赖其「未归档 + 自带子会话」语义，后端下线前维持不动。
 */
export async function apiUserProjectTabPageQuery(
  data: UserProjectPageQueryParams,
): Promise<RequestResponse<UserProjectTabPageResult>> {
  return request('/api/user-project/tab/page-query', {
    method: 'POST',
    data,
  });
}

/**
 * 用户项目分页查询（2026-09-14 两接口统一后的唯一列表接口）：
 * 与废弃的 tab 接口同款行结构（projectId 主键 + pinned/archived/collected 打标），
 * 差异两点：① 回包包含已归档项目（「已归档」视图数据源，归档维度仍无服务端
 * 过滤参数，消费侧按回包打标前端过滤）；② 不附带 conversations。
 * queryFilter 支持 collectedFilter（all=默认 / only=仅收藏）。
 */
export async function apiUserProjectPageQuery(
  data: UserProjectPageQueryParams,
): Promise<RequestResponse<UserProjectTabPageResult>> {
  return request('/api/user-project/page-query', {
    method: 'POST',
    data,
  });
}

/**
 * 查询项目会话列表（统一接口不再随列表回 conversations，展开项目时懒加载）。
 * 下沉自 SpaceProjectManage/services（页面层原路径原签名保持不动）；
 * 会话行与 tab 接口 conversations 同构，按 ConversationInfo 消费
 * （agent 等字段消费侧防御式可选访问）。
 */
export async function apiUserProjectConversations(
  projectId: number,
  projectType: AgentComponentTypeEnum,
): Promise<RequestResponse<ConversationInfo[]>> {
  return request(`/api/user-project/conversations/${projectId}`, {
    method: 'GET',
    params: { projectType },
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

/** 按应用ID查询（主键 id 即 app_id） */
export async function apiUserAppGetById(
  id: number,
): Promise<RequestResponse<UserAppInfo>> {
  return request(`/api/userapp/get/${id}`, {
    method: 'GET',
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

/** 项目置顶/取消置顶（swagger User project/pin：pinned + projectType query 均必传，
 * 后端做项目归属校验，缺省报 Required request parameter） */
export async function apiUserProjectPin(
  id: number,
  pinned: boolean,
  projectType: string,
): Promise<RequestResponse<null>> {
  return request(`/api/user-project/pin/${id}`, {
    method: 'POST',
    params: { pinned, projectType },
  });
}

/** 项目归档/取消归档（archived + projectType query 必传，同 pin 口径） */
export async function apiUserProjectArchive(
  id: number,
  archived: boolean,
  projectType: string,
): Promise<RequestResponse<null>> {
  return request(`/api/user-project/archive/${id}`, {
    method: 'POST',
    params: { archived, projectType },
  });
}

/** 项目收藏（2026-09-13 契约：与 pin/archive 不同，collect/unCollect 为双路径；
 * projectType 为必传 query 参数，同 conversation/create 的绑定校验口径） */
export async function apiUserProjectCollect(
  id: number,
  projectType: string,
): Promise<RequestResponse<null>> {
  return request(`/api/user-project/collect/${id}`, {
    method: 'POST',
    params: { projectType },
  });
}

/** 项目取消收藏（同上，双路径独立接口，projectType 必传） */
export async function apiUserProjectUnCollect(
  id: number,
  projectType: string,
): Promise<RequestResponse<null>> {
  return request(`/api/user-project/unCollect/${id}`, {
    method: 'POST',
    params: { projectType },
  });
}
