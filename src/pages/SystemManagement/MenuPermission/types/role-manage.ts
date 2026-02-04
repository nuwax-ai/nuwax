/**
 * 角色管理相关的类型定义和枚举
 */

import { MenuBindTypeEnum, UpdateMenuSortItem } from './menu-manage';
import { ResourceTreeNode } from './permission-resources';

// ==================== 枚举定义 ====================

/**
 * 角色状态枚举 1:启动 0:禁用
 */
export enum RoleStatusEnum {
  Enabled = 1, // 启用
  Disabled = 0, // 禁用
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

/**
 * 角色来源枚举 1:系统内置 2:用户自定义
 */
export enum RoleSourceEnum {
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
  source: RoleSourceEnum;
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
  /*来源 1:系统内置 2:用户自定义 */
  source?: RoleSourceEnum;
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
  modelIds?: Record<string, number>[];

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
 * 更新角色排序项
 */
export type UpdateRoleSortItem = UpdateMenuSortItem;

/**
 * 更新角色排序参数
 */
export interface UpdateRoleSortParams {
  // 待调整的列表
  items: UpdateRoleSortItem[];
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
  // resourceBindType: ResourceBindTypeEnum;
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
  source?: RoleSourceEnum;
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
 * 角色绑定数据权限参数
 * 对应接口：bindDataPermission
 */
export interface RoleBindDataPermissionParams {
  // 角色ID
  roleId: number;

  /*数据权限绑定 */
  dataPermission?: {
    /*模型ID列表，全部模型传[-1]，未选中任何模型不传或传空 */
    modelIds?: number[];

    /*token限制 */
    tokenLimit?: {
      /*每日token限制数量，0表示不限制 */
      limitPerDay?: number;
    };

    /*可访问的智能体id列表，null或空表示不限制 */
    agentIds?: number[];

    /*可访问的应用页面id列表，null或空表示不限制 */
    pageIds?: number[];

    /*可创建工作空间数量，-1表示不限制 */
    maxSpaceCount?: number;

    /*可创建智能体数量，-1表示不限制 */
    maxAgentCount?: number;

    /*可创建网页应用数量，-1表示不限制 */
    maxPageAppCount?: number;

    /*可创建知识库数量，-1表示不限制 */
    maxKnowledgeCount?: number;

    /*知识库存储空间上限(GB)，-1表示不限制 */
    knowledgeStorageLimitGb?: number;

    /*可创建数据表数量，-1表示不限制 */
    maxDataTableCount?: number;

    /*可创建定时任务数量，-1表示不限制 */
    maxScheduledTaskCount?: number;

    /*是否允许API外部调用，1-允许，0-不允许 */
    allowApiExternalCall?: number;

    /*智能体电脑内存(GB)，null表示使用默认值 */
    agentComputerMemoryGb?: number;

    /*智能体电脑CPU核心数，null表示使用默认值 */
    agentComputerCpuCores?: number;

    /*通用智能体执行结果文件存储天数，-1表示不限制 */
    agentFileStorageDays?: number;

    /*通用智能体每天对话次数，-1表示不限制 */
    agentDailyConversationLimit?: number;
  };
}
