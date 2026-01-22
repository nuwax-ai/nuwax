/**
 * 角色管理相关的类型定义和枚举
 */

// ==================== 枚举定义 ====================

/**
 * 角色状态枚举
 */
export enum RoleStatusEnum {
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
 * 角色信息
 */
export interface RoleInfo {
  /** 角色ID */
  id: number;
  /** 角色名称 */
  name: string;
  /** 角色代码 */
  code: string;
  /** 角色描述 */
  description: string;
  /** 数据范围 */
  dataScope: DataScopeEnum;
  /** 菜单权限数量 */
  menuPermissionCount: number;
  /** 状态 */
  status: RoleStatusEnum;
  /** 创建时间 */
  created: string;
  /** 更新时间 */
  modified: string;
}

/**
 * 查询角色列表参数
 */
export interface RoleListParams {
  pageNo?: number;
  pageSize?: number;
  queryFilter?: {
    name?: string;
    code?: string;
    status?: RoleStatusEnum;
  };
}

/**
 * 新增角色参数
 */
export interface AddRoleParams {
  name: string;
  code: string;
  description: string;
  dataScope: DataScopeEnum;
  menuPermissionIds?: number[];
}

/**
 * 更新角色参数
 */
export interface UpdateRoleParams {
  id: number;
  name: string;
  code: string;
  description: string;
  dataScope: DataScopeEnum;
  menuPermissionIds?: number[];
}

/**
 * 数据模型信息
 */
export interface DataModelInfo {
  /** 模型ID */
  id: number;
  /** 模型名称 */
  name: string;
  /** 模型描述 */
  description: string;
  /** 模型图标 */
  icon?: string;
}

/**
 * 菜单节点信息
 */
export interface MenuNodeInfo {
  /** 菜单ID */
  id: number;
  /** 菜单名称 */
  name: string;
  /** 菜单代码 */
  code?: string;
  /** 父菜单ID */
  parentId?: number;
  /** 子菜单列表 */
  children?: MenuNodeInfo[];
}
