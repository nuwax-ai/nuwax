/**
 * 权限资源管理相关的类型定义和枚举
 */

// ==================== 枚举定义 ====================

/*类型 1:模块 2:组件 3:页面 */
export enum ResourceTypeEnum {
  Module = 1, // 模块
  Component = 2, // 组件
}

/*来源 1:系统内置 2:用户自定义 */
export enum ResourceSourceEnum {
  SystemBuiltIn = 1, // 系统内置
  UserDefined = 2, // 用户自定义
}

// 是否显示 1:显示 0:隐藏
export enum ResourceVisibleEnum {
  Visible = 1, // 显示
  Hidden = 0, // 隐藏
}

/**
 * 	资源绑定类型 0:未绑定 1:全部绑定 2:部分绑定
 */
export enum ResourceBindTypeEnum {
  Unbound = 0, // 未绑定
  AllBound = 1, // 全部绑定
  PartiallyBound = 2, // 部分绑定
}

// ==================== 接口定义 ====================

/**
 * 权限资源信息
 */
export interface ResourceInfo {
  /** 资源ID */
  id: number;
  /** 编码 */
  code: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 来源 1:系统内置 2:用户自定义 */
  source: ResourceSourceEnum;
  /** 类型 1:模块 2:组件 */
  type: ResourceTypeEnum;
  /** 父级ID */
  parentId?: number;
  /** 访问路径 */
  path?: string;
  /** 排序 */
  sortIndex: number;
  /** 是否显示 1:显示 0:隐藏 */
  visible?: ResourceVisibleEnum;
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
 * 新增权限资源参数
 */
export interface AddResourceParams {
  /** 来源 1:系统内置 2:用户自定义 */
  source?: ResourceSourceEnum;
  /** 编码 */
  code?: string;
  /** 名称 */
  name?: string;
  /** 描述 */
  description?: string;
  /** 类型 1:模块 2:组件 */
  type?: ResourceTypeEnum;
  /** 父级ID */
  parentId?: number;
  /** 访问路径 */
  path?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sortIndex?: number;
  /** 是否显示 1:显示 0:隐藏 */
  visible?: ResourceVisibleEnum;
}

/**
 * 更新权限资源参数
 */
export interface UpdateResourceParams extends AddResourceParams {
  /** 资源ID，必传 */
  id: number;
}

/**
 * 根据条件查询权限资源参数
 */
export interface GetResourceListParams {
  /** 资源名称 */
  name?: string;
  /** 资源编码 */
  code?: string;
  /** 来源 1:系统内置 2:用户自定义 */
  source?: ResourceSourceEnum;
  /** 资源类型 1:模块 2:组件 */
  type?: ResourceTypeEnum;
  /** 父级ID */
  parentId?: number;
  /** 是否显示 1:显示 0:隐藏 */
  visible?: ResourceVisibleEnum;
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

  /*类型 1:模块 2:组件 */
  type?: ResourceTypeEnum;

  /*父级ID */
  parentId?: number;

  /*访问路径 */
  path?: string;

  /*图标 */
  icon?: string;

  /*排序 */
  sortIndex?: number;

  /*是否显示 1:显示 0:隐藏 */
  visible?: ResourceVisibleEnum;
}
