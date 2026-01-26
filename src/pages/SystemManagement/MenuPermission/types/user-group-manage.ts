/**
 * 用户组管理相关的类型定义和枚举
 */

import { MenuTreeNode } from './role-manage';

// ==================== 枚举定义 ====================

/**
 * 用户组状态枚举
 * 状态,1:启用 0:禁用
 */
export enum UserGroupStatusEnum {
  Enabled = 1, // 启用
  Disabled = 0, // 禁用
}

// ==================== 接口定义 ====================

/**
 * 用户组信息
 */
export interface UserGroupInfo {
  /** 用户组ID */
  id: number;
  /** 用户组名称 */
  name: string;
  /** 编码 */
  code: string;
  /** 用户组描述 */
  description: string;
  /** 来源 1:系统内置 2:用户自定义 */
  source: number;
  /** 状态,1:启用 0:禁用 */
  status: UserGroupStatusEnum;
  /** 最大用户数，0表示不限制 */
  maxUserCount: number;
  /** 数据模型ID列表，全部模型传[0],未选中任何模型不传值 */
  modelIds: number[];
  // token限制
  tokenLimit: {
    // 每日token限制数量，0表示不限制
    limitPerDay: number;
  };
  /** 排序 */
  sortIndex: number;
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

/**
 * 新增用户组参数
 */
export interface AddUserGroupParams {
  /** 编码 */
  code?: string;
  /** 名称 */
  name?: string;
  /** 描述 */
  description?: string;
  /* 状态,1:启用 0:禁用 */
  status?: UserGroupStatusEnum;
  /** 最大用户数，0表示不限制 */
  maxUserCount: number;
  /** 数据模型ID列表，全部模型传[0],未选中任何模型不传值 */
  modelIds: number[];
  // token限制
  tokenLimit: {
    // 每日token限制数量，0表示不限制
    limitPerDay: number;
  };
  /** 排序 */
  sortIndex?: number;
}

/**
 * 更新用户组参数
 */
export interface UpdateUserGroupParams extends AddUserGroupParams {
  /** 用户组ID，必传 */
  id: number;
}

/**
 * 组绑定用户参数
 */
export interface GroupBindUserParams {
  /** 用户组ID */
  groupId: number;
  /** 用户ID列表 */
  userIds: number[];
}

/**
 * 组绑定菜单权限参数
 */
export interface GroupBindMenuParams {
  /** 用户组ID */
  groupId: number;
  /** 菜单树节点 */
  menuTree: MenuTreeNode[];
}

/**
 * 根据条件查询用户组参数
 */
export interface GetUserGroupListParams {
  /** 用户组名称 */
  name?: string;
  /** 用户组编码 */
  code?: string;
  /** 来源 1:系统内置 2:用户自定义 */
  source: number;
  /** 状态,1:启用 0:禁用 */
  status: UserGroupStatusEnum;
}
