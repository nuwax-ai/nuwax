/**
 * 菜单管理相关的类型定义和枚举
 */

// ==================== 枚举定义 ====================

/**
 * 菜单状态 1:启用 0:禁用
 */
export enum MenuStatusEnum {
  Enabled = 1, // 启用
  Disabled = 0, // 禁用
}

/**
 * 菜单类型 1:父级菜单 2:末级菜单
 */
export enum MenuTypeEnum {
  Parent = 1, // 父级菜单
  Leaf = 2, // 末级菜单
}

// 子菜单绑定类型 0:未绑定 1:全部绑定 2:部分绑定
export enum MenuBindTypeEnum {
  Unbound = 0, // 未绑定
  AllBound = 1, // 全部绑定
  PartiallyBound = 2, // 部分绑定
}

// ==================== 接口定义 ====================

/**
 * 菜单信息
 */
export interface MenuInfo {
  /** 菜单ID */
  id: number;
  /** 编码 */
  code: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 类型 1:父级菜单 2:末级菜单 */
  type: MenuTypeEnum;
  /** 父级ID */
  parentId?: number;
  /** 访问路径 */
  path?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sortIndex: number;
  /** 状态 1:启用 0:禁用 */
  status: MenuStatusEnum;
  /** 关联的资源码列表（仅末级菜单） */
  resourceCodes?: string[];
  /** 创建人ID */
  creatorId?: number;
  /** 创建人 */
  creator?: string;
  /** 创建时间 */
  created?: string;
  /** 修改人ID */
  modifierId?: string;
  /** 修改人 */
  modifier?: string;
  /** 修改时间 */
  modified?: string;
}

/**
 * 新增菜单参数
 */
export interface AddMenuParams {
  /** 编码 */
  code?: string;
  /** 名称 */
  name?: string;
  /** 描述 */
  description?: string;
  /** 类型 1:父级菜单 2:末级菜单 */
  type?: MenuTypeEnum;
  /** 父级ID */
  parentId?: number;
  /** 访问路径 */
  path?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sortIndex?: number;
  /** 状态 1:启用 0:禁用 */
  status?: MenuStatusEnum;
  /** 关联的资源码列表（仅末级菜单） */
  resourceCodes?: string[];
}

/**
 * 更新菜单参数
 */
export interface UpdateMenuParams extends AddMenuParams {
  /** 菜单ID，必传 */
  id: number;
}

/**
 * 根据条件查询菜单参数
 */
export interface GetMenuListParams {
  /** 菜单名称 */
  name?: string;
  /** 菜单编码 */
  code?: string;
  /** 菜单类型 */
  type?: MenuTypeEnum;
  /** 状态 */
  status?: MenuStatusEnum;
}

/**
 * 菜单树节点（用于下拉选择和列表展示）
 */
export interface MenuTreeOption {
  /** 菜单ID */
  id: number;
  /** 编码 */
  code: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 类型 1:父级菜单 2:末级菜单 */
  type: MenuTypeEnum;
  /** 父级ID */
  parentId?: number;
  /** 访问路径 */
  path?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sortIndex: number;
  /** 状态 1:启用 0:禁用 */
  status: MenuStatusEnum;
  /** 关联的资源码列表（仅末级菜单） */
  resourceCodes?: string[];
  /** 子菜单列表 */
  children?: MenuTreeOption[];
}
