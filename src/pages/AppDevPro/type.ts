import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import { TablePageRequest } from '@/types/interfaces/request';

export enum UserAppStageEnum {
  Dev = 'dev',
  Prod = 'prod',
}

/** 用户项目（包括常规项目、全栈应用、网页应用）分页查询 */
export type UserProjectPageQueryParams = TablePageRequest<{
  spaceId: number;
  creatorId: number;
  // 项目类型：NormalProject/UserApp/PageApp,可用值:Agent,Plugin,Skill,PageApp,UserApp,NormalProject,Workflow,Knowledge,Table,Model,Mcp
  projectType: AgentComponentTypeEnum;
  // 项目名称（模糊匹配）
  name: string;
}>;

/** 创建全栈应用参数 */
export interface CreateUserAppParams {
  /** 空间ID，不传则默认放在个人空间 */
  spaceId?: number;
  /** 应用名称，不传则使用默认名称 */
  name?: string;
  /** 应用描述 */
  description?: string;
  /** 应用图标 */
  icon?: string;
  /** 沙箱ID */
  sandboxId?: number;
}

/** 发布版本记录 */
export interface PublishVersionDto {
  /** 版本号 */
  version: string;
  /** Git 提交哈希 */
  gitCommit: string;
  /** 是否为最新版本 */
  latest: boolean;
  /** 安装包地址 */
  packageUrl: string;
}

/** 全栈应用详情（创建接口返回；id 即 app_id） */
export interface UserAppInfo {
  /** 应用ID（项目主键 id，即 app_id） */
  id: number;
  /** 商户ID */
  tenantId: number;
  /** 空间ID */
  spaceId: number;
  /** 创建人用户ID */
  creatorId: number;
  /** 应用名称 */
  name: string;
  /** 应用描述 */
  description: string;
  /** 应用图标 */
  icon: string;
  /** 封面图片 */
  coverImg: string;
  /** 沙箱ID */
  sandboxId: number;
  /** 发布状态 */
  publishStatus: PublishStatusEnum;
  /** 发布版本记录 */
  publishVersions: PublishVersionDto[];
  /** 开发环境数据库账号 */
  devDbUsername: string;
  /** 开发环境数据库密码是否已设置 */
  devDbPasswordSet: boolean;
  /** 生产环境数据库账号 */
  prodDbUsername: string;
  /** 生产环境数据库密码是否已设置 */
  prodDbPasswordSet: boolean;
  /** 更新时间 */
  modified: string;
  /** 创建时间 */
  created: string;
}

/** 更新全栈应用参数 */
export interface UpdateUserAppParams {
  /*应用ID */
  id: number;

  /*应用名称 */
  name?: string;

  /*应用描述 */
  description?: string;

  /*应用图标 */
  icon?: string;

  /*封面图片 */
  coverImg?: string;
}

// 开发阶段: 启动开发容器参数
export interface UserAppStartDevParams {
  /** 应用ID */
  appId?: number;
  /** 部署版本 */
  releaseId?: string;
}

/** 启动开发容器异步任务行 */
export interface UserAppDevTaskInfo {
  /** 任务记录 ID */
  id: number;
  /** 商户ID */
  tenantId: number;
  /** 应用ID */
  appId: number;
  /** 发起用户ID */
  userId: number;
  /** 任务类型 */
  taskType: string;
  /** 任务ID */
  taskId: string;
  /** 任务状态 */
  status: string;
  /** 错误信息 */
  error: string;
  /** 沙箱服务 ID */
  sandboxServerId: string;
  /** 创建时间 */
  created: string;
  /** 更新时间 */
  modified: string;
}

export interface UserAppLogsQueryParams {
  /*应用ID */
  appId: number;

  /*环境：dev 开发环境（默认）；prod 发布环境 */
  env?: string;

  /*增量拉取游标（上次响应返回的 cursor，支持断点续拉） */
  cursor?: string;

  /*关键字过滤（子串匹配） */
  keyword?: string;

  /*日志级别过滤，如 ["WARN","ERROR"]；空 = 不过滤 */
  levels?: Record<string, unknown>[];

  /*服务/日志源选择器 */
  selectors?: {
    /*服务ID（manifest 中声明的 service 名，如 "api"、"web"） */
    serviceId: string;

    /*日志源 ID 列表（空 = 该服务全部源） */
    sourceIds?: Record<string, unknown>[];
  }[];

  /*起始时间过滤（RFC3339） */
  since?: string;

  /*每源尾部行数限制（单源上限 10000） */
  tail?: number;

  /*结束时间过滤（RFC3339） */
  until?: string;
}

/** 应用日志单行 */
export interface UserAppLogItem {
  /** 行号 */
  line?: number;
  /** 日志内容 */
  content?: string;
  /** 日志内容（兼容 message 字段） */
  message?: string;
  /** 日志内容（兼容 text 字段） */
  text?: string;
  /** 时间戳 */
  timestamp?: string;
  /** 日志级别 */
  level?: string;
}

/** 查询应用日志返回 */
export interface UserAppLogsQueryResult {
  /** 增量拉取游标 */
  cursor?: string;
  /** 日志列表 */
  logs?: Array<UserAppLogItem | string>;
  /** 日志列表（兼容 lines） */
  lines?: Array<UserAppLogItem | string>;
  /** 日志列表（兼容 records） */
  records?: Array<UserAppLogItem | string>;
}