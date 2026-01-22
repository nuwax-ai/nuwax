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

// 子菜单绑定类型 0:未绑定 1:全部绑定 2:部分绑定
export enum MenuBindTypeEnum {
  Unbound = 0, // 未绑定
  AllBound = 1, // 全部绑定
  PartiallyBound = 2, // 部分绑定
}

/**
 * 资源绑定类型 0:未绑定 1:全部绑定 2:部分绑定
 */
export enum ResourceBindTypeEnum {
  Unbound = 0, // 未绑定
  AllBound = 1, // 全部绑定
  PartiallyBound = 2, // 部分绑定
}

/**
 * 资源状态 1:启用 0:禁用
 */
export enum ResourceStatusEnum {
  Enabled = 1, // 启用
  Disabled = 0, // 禁用
}

// 是否显示 1:显示 0:隐藏
export enum ResourceVisibleEnum {
  Visible = 1, // 显示
  Hidden = 0, // 隐藏
}

/**
 * 角色绑定用户参数
 */
export interface RoleBindUserParams {
  // 角色ID, 必传
  roleId: number;
  // 用户ID列表, 必传
  userIds: number[];
}

/*类型 1:模块 2:组件 3:页面 */
export enum ResourceTypeEnum {
  Module = 1, // 模块
  Component = 2, // 组件
  Page = 3, // 页面
}

/*来源 1:系统内置 2:用户自定义 */
export enum ResourceSourceEnum {
  SystemBuiltIn = 1, // 系统内置
  UserDefined = 2, // 用户自定义
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
  /** 编码 */
  code: string;
  /** 角色描述 */
  description: string;
  /** 来源 1:系统内置 2:用户自定义 */
  source: number;
  /** 状态 */
  status: RoleStatusEnum;
  /** 排序 */
  sortIndex: number;
  /** 模型ID列表 全部模型传[0],未选中任何模型不传值 */
  modelIds: number[];
  /*token限制 */
  tokenLimit?: {
    /*每日token限制数量，0表示不限制 */
    limitPerDay?: number;
  };
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
 * 新增角色参数
 */
export interface AddRoleParams {
  /*编码 */
  code?: string;

  /*名称 */
  name?: string;

  /*描述 */
  description?: string;

  /*状态 1:启动 0:禁用 */
  status?: RoleStatusEnum;

  /*排序 */
  sortIndex?: number;

  /*模型ID列表 全部模型传[0],未选中任何模型不传值 */
  modelIds?: Record<string, unknown>[];

  /*token限制 */
  tokenLimit?: {
    /*每日token限制数量，0表示不限制 */
    limitPerDay?: number;
  };
}

/**
 * 更新角色参数
 */
export interface UpdateRoleParams extends AddRoleParams {
  // 角色ID, 必传
  id: number;
}

/**
 * 资源树节点
 */
export interface ResourceTreeNode {
  /*资源ID */
  id: number;

  /*资源绑定类型 0:未绑定 1:全部绑定 2:部分绑定 */
  resourceBindType?: ResourceBindTypeEnum;

  /*子资源列表 */
  children?: ResourceTreeNode[];

  /*编码 */
  code?: string;

  /*名称 */
  name?: string;

  /*描述 */
  description?: string;

  /*来源 1:系统内置 2:用户自定义 */
  source?: ResourceSourceEnum;

  /*类型 1:模块 2:组件 3:页面 */
  type?: ResourceTypeEnum;

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
}

/**
 * 菜单树节点
 */
export interface MenuTreeNode {
  // 菜单ID
  menuId: number;
  // 子菜单绑定类型 0:未绑定 1:全部绑定 2:部分绑定
  menuBindType: MenuBindTypeEnum;
  // 子菜单列表
  children?: MenuTreeNode[];
  // 资源绑定类型 0:未绑定 1:全部绑定 2:部分绑定
  resourceBindType: ResourceBindTypeEnum;
  // 资源树节点
  resourceTree?: ResourceTreeNode[];
}

/**
 * 角色绑定菜单参数
 */
export interface RoleBindMenuParams {
  /*角色ID */
  roleId: number;

  /*菜单树节点 */
  menuTree: MenuTreeNode[];
}

/**
 * 根据条件查询角色参数
 */
export interface GetRoleListParams {
  // 角色名称
  name?: string;
  // 角色编码
  code?: string;
  // 来源 1:系统内置 2:用户自定义
  source?: ResourceSourceEnum;
  // 状态 1:启用 0:禁用
  status?: RoleStatusEnum;
}

/**
 * 用户信息
 */
export interface UserInfo {
  // 用户ID
  userId: number;
  // 用户名
  userName: string;
  // 用户昵称
  nickName: string;
  // 用户头像
  avatar: string;
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
  creator: string;

  // 创建时间
  created: string;

  // 修改人ID
  modifierId: string;

  // 修改人
  modifier: string;

  // 修改时间
  modified: string;

  /*	子菜单列表 */
  children?: MenuNodeInfo[];

  // 资源树节点
  resourceTree?: ResourceTreeNode[];
}
