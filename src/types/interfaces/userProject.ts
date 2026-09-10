/**
 * 用户项目 / 全栈应用类型定义
 * @description 下沉自 pages/AppDevPro/type.ts（分层红线：非页面层禁止依赖 @/pages/**），
 * 页面层原路径再导出保持既有引用不变，新消费方请直接从本模块引入。
 */

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { TablePageRequest } from '@/types/interfaces/request';

export enum UserAppStageEnum {
  Dev = 'dev',
  Prod = 'prod',
}

/** 应用进行中任务类型 */
export enum UserAppTaskTypeEnum {
  /** 启动开发容器 */
  DevStart = 'dev_start',
  /** 重启开发容器 */
  DevRestart = 'dev_restart',
  /** 构建 */
  Build = 'build',
}

/** 用户项目（包括常规项目、全栈应用、网页应用）分页查询 */
export type UserProjectPageQueryParams = TablePageRequest<
  Partial<{
    spaceId: number;
    creatorId: number;
    // 项目类型：NormalProject/UserApp/PageApp,可用值:Agent,Plugin,Skill,PageApp,UserApp,NormalProject,Workflow,Knowledge,Table,Model,Mcp
    projectType: AgentComponentTypeEnum;
    // 项目名称（模糊匹配）
    name: string;
  }>
>;

/**
 * 用户项目分页查询结果行（前端先行定义，与 mock 对齐；
 * 后端真实结构若不同只需改此类型一处）
 */
export interface UserProjectItem {
  /** 项目ID（UserApp/NormalProject 即 app_id；PageApp 为页面项目 id） */
  id: number;
  /** 空间ID */
  spaceId: number;
  /** 项目类型 */
  projectType: AgentComponentTypeEnum;
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description: string;
  /** 项目图标 */
  icon: string;
  /** 发布状态（PageApp/UserApp 语义一致；常规项目为草稿态） */
  publishStatus: PublishStatusEnum;
  /** 更新时间 */
  modified: string;
  /** 创建时间 */
  created: string;
}

/** 用户项目分页查询结果（mybatis-plus IPage 风格） */
export interface UserProjectPageResult {
  records: UserProjectItem[];
  total: number;
  current: number;
  size: number;
}

/**
 * tab 项目条目：/api/user-project/tab/page-query 记录行（2026-09-08 新接口，实测契约）。
 * 与 UserProjectItem 的差异：主键字段为 projectId、无 publishStatus、附带项目下会话列表。
 */
export interface UserProjectTabItem {
  /** 项目ID（UserApp/NormalProject 即 app_id） */
  projectId: number;
  /** 空间ID */
  spaceId: number;
  /** 项目类型 */
  projectType: AgentComponentTypeEnum;
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description?: string | null;
  /** 项目图标 */
  icon?: string | null;
  /** 沙箱ID */
  sandboxId?: number;
  /** 沙箱类型（Cloud 等） */
  sandboxType?: string;
  /** 工作目录 */
  workspaceDir?: string | null;
  /** 项目绑定的最新会话 ID（无则为 null） */
  conversationId?: number | null;
  /** 项目下的会话列表（tab 接口附带返回） */
  conversations?: ConversationInfo[];
  /** 更新时间 */
  modified: string;
  /** 创建时间 */
  created: string;
}

/** tab 项目分页查询结果（mybatis-plus IPage 风格） */
export interface UserProjectTabPageResult {
  records: UserProjectTabItem[];
  total: number;
  current: number;
  size: number;
  pages?: number;
}

/** 创建常规项目参数（管理端 /api/user-project/create；首页对话框创建走 /api/project/create 另一套） */
export interface CreateUserProjectParams {
  spaceId?: number;
  name: string;
  description?: string;
  icon?: string;
  sandboxId?: number;
  devAgentId?: number;
}

/** 更新常规项目参数（传 null 的字段不更新，与全栈应用 update 同语义） */
export interface UpdateUserProjectParams {
  id: number;
  name?: string;
  description?: string;
  icon?: string;
}

/** 项目最新会话返回（后端契约未细化字段，调用侧防御式取 conversationId/id） */
export interface ProjectLatestConversationResult {
  conversationId?: number;
  id?: number;
}

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
  taskType: UserAppTaskTypeEnum;
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

/**
 * 查询应用进行中任务与操作可用性返回
 * devActionAllowed-标志可否在开发环境下，是否可以启动服务发起, true 可以, false 不可以
 * buildAllowed-标志可否发起构建, true 可以, false 不可以
 */
export interface UserAppTasksActiveResult {
  /** 进行中的任务列表 */
  tasks: UserAppDevTaskInfo[];
  /** 是否允许发起开发操作 */
  devActionAllowed: boolean;
  /** 是否允许发起构建 */
  buildAllowed: boolean;
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

export interface UserAppLogsSourcesQueryParams {
  /*应用ID */
  appId: number;
  /*环境：dev 开发环境（默认）；prod 发布环境 */
  env?: UserAppStageEnum;
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

/** 运行时操作：启动 / 重启 / 停止 */
export type UserAppRuntimeAction = 'start' | 'restart' | 'stop';

/** 发布 / 启动任务流程阶段 */
export type UserAppPublishPhase =
  | 'idle'
  | 'starting'
  | 'building'
  | 'applying'
  | 'success'
  | 'failed'
  | 'cancelled';

/** 任务终态 */
export type UserAppTaskTerminalStatus = 'succeeded' | 'failed' | 'cancelled';

/** 单个服务（serviceId）的构建进度 */
export interface UserAppTaskServiceProgress {
  /** 服务 ID，如 web / api */
  serviceId: string;
  /** 进度 0-100 */
  progress: number;
  /** 服务状态文案 */
  status: string;
  /** 日志行 */
  logs: string[];
}

/** 任务进度 SSE 事件（字段做兼容解析） */
export interface UserAppTaskLogEvent {
  seq?: number;
  serviceId?: string;
  service?: string;
  status?: string;
  taskStatus?: string;
  progress?: number;
  percent?: number;
  message?: string;
  log?: string;
  content?: string;
  text?: string;
  line?: string;
  error?: string;
  done?: boolean;
  completed?: boolean;
  type?: string;
  [key: string]: unknown;
}
