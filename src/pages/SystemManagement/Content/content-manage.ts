import { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import {
  RoleSourceEnum,
  RoleStatusEnum,
} from '../MenuPermission/types/role-manage';
import {
  UserGroupSourceEnum,
  UserGroupStatusEnum,
} from '../MenuPermission/types/user-group-manage';

/**
 * 可访问的角色信息
 */
export interface AccessibleRoleInfo {
  /** 角色ID */
  id: number;
  /** 角色名称 */
  name: string;
  /** 编码 */
  code: string;
  /** 角色描述 */
  description: string;
  /** 来源 1:系统内置 2:用户自定义 */
  source: RoleSourceEnum;
  /** 状态 */
  status: RoleStatusEnum;
  /** 排序 */
  sortIndex: number;
  /** 租户ID */
  tenantId: number;
  // 创建人ID
  creatorId: number;
  // 创建人
  creator: string;
  // 创建时间
  created: string;
  // 修改人ID
  modifierId: string;
  // 修改人
  modifier: string;
  // 修改时间
  modified: string;
}

/**
 * 可访问的用户组信息
 */
export interface AccessibleUserGroupInfo {
  /** 用户组ID */
  id: number;
  /** 用户组名称 */
  name: string;
  /** 编码 */
  code: string;
  /** 用户组描述 */
  description: string;
  /** 来源 1:系统内置 2:用户自定义 */
  source: UserGroupSourceEnum;
  /** 状态,1:启用 0:禁用 */
  status: UserGroupStatusEnum;
  /** 最大用户数，0表示不限制 */
  maxUserCount: number;
  /** 排序 */
  sortIndex: number;
  /** 租户ID */
  tenantId: number;
  /** 创建人ID */
  creatorId: number;
  /** 创建人 */
  creator: string;
  /** 创建时间 */
  created: string;
  /** 修改人ID */
  modifierId: string;
  /** 修改人 */
  modifier: string;
  /** 修改时间 */
  modified: string;
}

/** 智能体限制访问的对象 */
export interface AgentRestrictionTargets {
  // 可访问的角色列表
  roles: AccessibleRoleInfo[];
  // 可访问的用户组列表
  groups: AccessibleUserGroupInfo[];
}

/** 绑定智能体限制访问对象参数 */
export interface AgentBindRestrictionTargetsParams {
  // 主体ID（如模型ID、智能体ID、网页应用ID）
  subjectId: number;
  // 可访问的角色ID列表
  roleIds: number[];
  // 可访问的用户组ID列表
  groupIds: number[];
}

// 查询智能体限制访问的对象
export async function apiAgentRestrictionTargets(
  agentId: number,
): Promise<RequestResponse<AgentRestrictionTargets>> {
  return request(`/api/system/resource/agent/restriction-targets/${agentId}`, {
    method: 'GET',
  });
}

// 绑定智能体限制访问对象（全量覆盖）
export async function apiAgentBindRestrictionTargets(
  data: AgentBindRestrictionTargetsParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/resource/agent/bind-restriction-targets', {
    method: 'POST',
    data,
  });
}

// 查询网页应用限制访问的对象
export async function apiPageAgentRestrictionTargets(
  pageAgentId: number,
): Promise<RequestResponse<AgentRestrictionTargets>> {
  return request(
    `/api/system/resource/page/restriction-targets/${pageAgentId}`,
    {
      method: 'GET',
    },
  );
}

// 绑定网页应用限制访问对象（全量覆盖）
export async function apiPageAgentBindRestrictionTargets(
  data: AgentBindRestrictionTargetsParams,
): Promise<RequestResponse<AgentRestrictionTargets>> {
  return request('/api/system/resource/page/bind-restriction-targets', {
    method: 'POST',
    data,
  });
}

// 访问受限设置 (智能体、网页应用)
export async function apiSystemResourceAgentAccess(
  id: number,
  status: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/agent/access/${id}/${status}`, {
    method: 'POST',
  });
}
