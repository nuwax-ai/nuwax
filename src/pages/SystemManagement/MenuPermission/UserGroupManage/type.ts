/**
 * 用户组管理相关的类型定义和枚举
 */

// ==================== 枚举定义 ====================

/**
 * 用户组状态枚举
 */
export enum UserGroupStatusEnum {
  Enabled = 'Enabled', // 启用
  Disabled = 'Disabled', // 禁用
}

/**
 * 数据范围枚举
 */
export enum DataScopeEnum {
  All = 'All', // 全部数据
  Department = 'Department', // 本部门数据
  Self = 'Self', // 仅本人数据
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
  /** 状态 */
  status: UserGroupStatusEnum;
  /** 数据范围 */
  dataScope: DataScopeEnum;
  /** 最大用户数，0表示不限制 */
  maxUsers: number;
  /** 关联的角色ID列表 */
  roleIds: number[];
  /** 关联的角色信息列表 */
  roles?: Array<{
    id: number;
    name: string;
  }>;
  /** 菜单权限数量 */
  menuPermissionCount?: number;
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
  /** 状态 */
  status?: UserGroupStatusEnum;
  /** 数据范围 */
  dataScope?: DataScopeEnum;
  /** 最大用户数，0表示不限制 */
  maxUsers?: number;
  /** 关联的角色ID列表 */
  roleIds?: number[];
  /** 数据模型ID列表，全部模型传[0],未选中任何模型不传值 */
  modelIds?: number[];
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
 * 根据条件查询用户组参数
 */
export interface GetUserGroupListParams {
  /** 用户组名称 */
  name?: string;
  /** 用户组编码 */
  code?: string;
  /** 状态 */
  status?: UserGroupStatusEnum;
}
