/**
 * 菜单管理相关的类型定义和枚举
 */

import {
  ResourceSourceEnum,
  ResourceStatusEnum,
  ResourceTreeNode,
  ResourceVisibleEnum,
} from './permission-resources';

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

/**
 * 是否显示 1:显示 0:隐藏
 */
export enum MenuVisibleEnum {
  Visible = 1, // 显示
  Hidden = 0, // 隐藏
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
  // 是否显示 1:显示 0:隐藏
  visible?: MenuVisibleEnum;
  /** 资源树 */
  resourceTree?: ResourceTreeNode[];
}

/**
 * 更新菜单参数
 */
export interface UpdateMenuParams extends AddMenuParams {
  /** 菜单ID，必传 */
  id: number;
}

/**
 * 绑定菜单资源参数
 */
export interface BindMenuResourceParams {
  /** 菜单ID，必传 */
  menuId: number;
  /** 资源树 */
  resourceTree: ResourceTreeNode[];
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
 * 菜单节点信息
 */
export interface MenuNodeInfo {
  /* 菜单ID */
  id: number;

  /*资源码 */
  code?: string;

  /*名称 */
  name?: string;

  /*描述 */
  description?: string;

  /*来源 1:系统内置 2:用户自定义 */
  source?: ResourceSourceEnum;

  /*父级ID */
  parentId?: number;

  /*访问路径 */
  path?: string;

  /*图标 */
  icon?: string;

  /*排序 */
  sortIndex?: number;

  /*状态 1:启用 0:禁用 */
  status?: ResourceStatusEnum;

  /*是否显示 1:显示 0:隐藏 */
  visible?: ResourceVisibleEnum;

  // 创建人
  creator?: string;

  // 创建时间
  created?: string;

  // 修改人ID
  modifierId?: string;

  // 修改人
  modifier?: string;

  // 修改时间
  modified?: string;

  /*	子菜单列表 */
  children?: MenuNodeInfo[];

  // 子菜单绑定类型 0:未绑定 1:全部绑定 2:部分绑定
  menuBindType: MenuBindTypeEnum;

  // 资源树节点
  resourceTree?: ResourceTreeNode[];
}
