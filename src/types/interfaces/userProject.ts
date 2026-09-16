/**
 * 用户项目 / 全栈应用类型定义
 * @description 下沉自 pages/AppDevPro/type.ts（分层红线：非页面层禁止依赖 @/pages/**），
 * 页面层原路径再导出保持既有引用不变，新消费方请直接从本模块引入。
 */

import {
  AgentComponentTypeEnum,
  TaskStatus,
  TaskTypeEnum,
} from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import type { AgentDetailDto } from '@/types/interfaces/agent';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { TablePageRequest } from '@/types/interfaces/request';

/** 应用沙箱类型 */
export enum UserAppSandboxTypeEnum {
  Cloud = 'Cloud',
  Personal = 'Personal',
}

/** 发布部署目标 */
export enum UserAppDeployTypeEnum {
  Platform = 'platform',
  Private = 'private',
}

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

/** 应用任务状态，对应后端 UserAppTaskStatus */
export enum UserAppTaskStatusEnum {
  /** 已受理未开始 */
  Pending = 'pending',
  /** 编译 / 启停执行中 */
  Running = 'running',
  /** 成功（终态） */
  Completed = 'completed',
  /** 失败（终态），看 error 字段 */
  Failed = 'failed',
  /** 被取消（终态） */
  Cancelled = 'cancelled',
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
    // 收藏过滤：all=全部（后端默认）；only=仅收藏。2026-09-14 两接口统一：
    // tab 接口废弃，统一接口（page-query）已支持本参数（历史会话页「项目」tab 消费）
    collectedFilter: 'all' | 'only';
    // 归档过滤：默认不传=剔除归档项目（testagent 2026-09-15 实测，默认回包不含
    // 归档行）；only=仅归档；all=含归档。历史会话页「已归档」视图传 only，
    // 消费侧仍按回包 archived 打标过滤兜底
    archivedFilter: 'all' | 'only';
  }>
>;

/**
 * 用户项目分页查询结果行（前端先行定义；2026-09-10 实测 page-query 真实行
 * 与 tab 接口同款：主键字段为 projectId（无 id）、附带 conversationId/sandboxId，
 * 消费侧（SpaceProjectManage）已就地归一 id，其余字段名一致）
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
  /** 项目绑定的最新会话 ID（实测行附带，无会话为 null） */
  conversationId?: number | null;
  /** 沙箱ID（实测行附带；云端项目为哨兵 -1，勿按 truthiness 判断是否个人电脑） */
  sandboxId?: number;
  /** 更新时间 */
  modified: string;
  /** 创建时间 */
  created: string;
}

/** 常规项目详情（/api/normal-project/get/{id} 返回） */
export interface UserNormalProjectInfo {
  /** 商户ID */
  tenantId: number;
  /** 空间ID */
  spaceId: number;
  /** 创建人用户ID */
  creatorId: number;
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description: string;
  /** 项目图标 */
  icon: string;
  /** 项目类型 */
  projectType: AgentComponentTypeEnum;
  /** 项目ID */
  projectId: number;
  /** 沙箱ID */
  sandboxId: number;
  /** 沙箱类型 */
  sandboxType: UserAppSandboxTypeEnum;
  /** 开发关联智能体ID；常规项目为空 */
  devAgentId?: number | null;
  /** 资料库目录ID */
  repoSlugId: string;
  /** 项目计划表ID */
  planSlugId: string;
  /** OAuth2 Client ID；仅三方应用有值 */
  oauthClientId?: string | null;
  /** 应用主页地址 */
  homepageUrl?: string | null;
  /** OAuth2 回调地址 */
  redirectUri?: string | null;
  /** OAuth2 接入是否启用 */
  oauthEnabled?: boolean;
  /** 置顶标记 */
  pinned: boolean;
  /** 归档标记 */
  archived: boolean;
  /** 当前用户收藏标记 */
  collected: boolean;
  /** 更新时间 */
  modified: string;
  /** 创建时间 */
  created: string;
  /** 开发智能体关联的会话ID（不落库，仅传输） */
  conversationId?: number | null;
}

/** 用户项目分页查询结果（mybatis-plus IPage 风格） */
export interface UserProjectPageResult {
  records: UserProjectItem[];
  total: number;
  current: number;
  size: number;
}

/**
 * tab 项目条目：项目列表查询接口的记录行（2026-09-08 tab 接口实测契约）。
 * 与 UserProjectItem 的差异：主键字段为 projectId、无 publishStatus、附带项目下会话列表。
 * 2026-09-14 两接口统一后行结构不变（projectId 主键 + 打标字段），仅
 * conversations 不再随列表回包（统一接口不附带，展开项目时经
 * /api/user-project/conversations/{projectId} 懒加载填充），类型上保持可选兼容两种来源。
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
  /** 沙箱ID（云端项目为哨兵 -1，勿按 truthiness 判断是否个人电脑） */
  sandboxId?: number;
  /** 沙箱类型（Cloud 等） */
  sandboxType?: string;
  /** 工作目录 */
  workspacePath?: string | null;
  /** 项目绑定的最新会话 ID（无则为 null） */
  conversationId?: number | null;
  /**
   * 项目绑定的调试智能体 ID（全栈项目默认命中智能体用）。
   * 契约先行（2026-09-10 后端未 ready，接口暂不返回 → undefined，
   * 首页走「提示手动选择」降级路径）。
   */
  devAgentId?: number;
  /** 项目下的会话列表（tab 接口随列表附带；统一接口不回包，展开时懒加载填充） */
  conversations?: ConversationInfo[];
  /**
   * 项目置顶标记（wiki 2026-09-11 契约先行：后端 pin/archive 接口已就位，
   * 列表回读字段名未细化，字段未返回时为 undefined，消费侧按 === true 判断）
   */
  pinned?: boolean;
  /** 项目归档标记（同上，契约先行防御式） */
  archived?: boolean;
  /** 项目收藏标记（2026-09-13 collect/unCollect 接口上线，列表回读打标） */
  collected?: boolean;
  /** 更新时间 */
  modified: string;
  /** 创建时间 */
  created: string;
}

/**
 * 项目会话列表项（/api/user-project/conversations/{projectId}）。
 */
export interface UserProjectConversationInfo {
  /** 会话 ID */
  id: number;
  tenantId: number;
  userId: number;
  /** 会话 UUID */
  uid: string;
  /** 智能体 ID */
  agentId: number;
  /** 会话主题 */
  topic: string;
  /** 会话摘要，开启长期记忆时会对每次会话进行总结 */
  summary: string;
  /** 会话图标 */
  icon?: string;
  /** 用户填写的会话变量内容 */
  variables?: Record<string, string | number> | null;
  modified: string;
  created: string;
  /** 已发布过的 agent 才有此信息 */
  agent?: AgentDetailDto;
  /** 会话消息列表，会话列表查询时不会返回 */
  messageList?: MessageInfo[];
  // 任务类型 可用值:Chat,TempChat,TASK,TaskCenter (会话、临时会话、任务、任务中心)
  type: TaskTypeEnum;
  taskId?: string;
  // 任务状态，只针对 EXECUTING（执行中）做展示,可用值:CREATE,EXECUTING,CANCEL,COMPLETE,FAILED
  taskStatus: TaskStatus;
  taskCron?: string;
  taskCronDesc?: string;
  // 开发模式
  devMode: boolean;
  /** 会话主题是否更新 */
  topicUpdated?: number;
  sandboxServerId?: string;
  sandboxSessionId?: string;
  /** 开发项目所在的空间 ID */
  devSpaceId?: number;
  /** 开发目标类型，如 Agent, PageApp, Skill, Plugin */
  devTargetType?: string;
  /** 开发模式目标 ID */
  devTargetId?: string;
  /** 文件访问路径（file server/主容器视角；空=老数据走兼容逻辑） */
  fileWorkspacePath?: string;
  /** agent 执行路径（执行容器内视角；空=老数据走兼容逻辑） */
  agentWorkspacePath?: string;
  /** 置顶标记 */
  pinned?: boolean;
  /** 归档标记 */
  archived?: boolean;
  /** 当前用户收藏标记 */
  collected?: boolean;
  /** 已分享的 URI，比对上了则不需要认证 */
  sharedUris?: string[];
  extra?: Record<string, unknown>;
  /** 会话所属用户名 */
  userName?: string;
}

/** tab 项目分页查询结果（mybatis-plus IPage 风格） */
export interface UserProjectTabPageResult {
  records: UserProjectTabItem[];
  total: number;
  current: number;
  size: number;
  pages?: number;
}

/**
 * 首页项目上框信息（项目列表「+ 新建会话」→ /home 的页面间透传协议，
 * 落 types 层供 hooks/utils/layouts/pages 共用）。
 * 上框存在期间：首页只允许同类型智能体切换、发送直接建会话不走 project/create。
 */
export interface PinnedProjectInfo {
  /** 项目 ID（UserApp/NormalProject 即 app_id） */
  projectId: number;
  /** 项目所属空间 ID（全栈跳转 IDE 用） */
  spaceId?: number;
  /** 项目类型（UserApp=全栈 / NormalProject=常规；PageApp 不上框） */
  projectType: AgentComponentTypeEnum;
  /** 项目名称（上框展示） */
  name: string;
  /** 项目图标（上框展示，可能为 null） */
  icon?: string | null;
  /** 项目沙箱 ID（会话创建优先携带；云端项目为哨兵 -1，勿按 truthiness 判断是否个人电脑） */
  sandboxId?: number;
  /** 项目绑定的调试智能体 ID（全栈默认命中用；契约先行，缺失走手选降级） */
  devAgentId?: number;
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

/** 项目最新会话返回（后端契约未细化字段，调用侧防御式取 conversationId/id/agentId） */
export interface ProjectLatestConversationResult {
  conversationId?: number;
  id?: number;
  /** 会话归属智能体（常规项目跳 home/chat 详情的路由参数，缺省时回退 IDE 路由） */
  agentId?: number;
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
  /**
   * 沙箱ID。全栈仅云端（workspaceDirPolicy）：传云电脑哨兵值 -1，
   * 由后端分配云端沙箱（与首页 /api/project/create 创建全栈的传值对齐）。
   */
  sandboxId?: number;
  /**
   * 调试关联智能体ID（对齐首页创建全栈：首页传生效智能体，无推荐位场景
   * 传租户默认任务智能体；契约先行，后端就绪即生效）。
   */
  devAgentId?: number;
}

/** 构建包版本（/api/userapp/build-versions 列表项） */
export interface BuildVersionDto {
  /** 版本号 */
  version: string;
  /** Git 提交 */
  gitCommit: string;
  /** 是否最新版本 */
  latest: boolean;
  /** 安装包地址 */
  packageUrl: string;
  /** 构建时间（date-time） */
  buildTime: string;
}

/** 全栈应用详情（创建 / get 接口返回；id 即 app_id） */
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
  /** 沙箱类型 */
  sandboxType?: UserAppSandboxTypeEnum;
  /** 发布部署目标：platform 平台部署 / private 私服部署 */
  deployType?: UserAppDeployTypeEnum;
  /** 部署目标服务器ID */
  deployServerId?: number;
  /** 资料库协作目录ID */
  repoSlugId?: string;
  /** 项目计划多维表格ID */
  planSlugId?: string;
  /** 开发关联智能体ID */
  devAgentId?: number;
  /** 是否已部署到生产环境；为 true 才可切换线上环境 */
  prodDeployed?: boolean;
  /** 当前生产部署的版本号 */
  prodReleaseId?: string;
  /** 发布状态 */
  publishStatus: PublishStatusEnum;
  /** 构建版本记录 */
  buildVersions?: BuildVersionDto[];
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
  /**
   * 开发智能体关联的会话 ID（不落库，传输用）：
   * 创建接口响应携带；详情等其余接口可不返回。
   */
  conversationId?: number;
}

/** 应用域名类型(全栈应用 domain/list 回包) */
export enum UserAppDomainTypeEnum {
  /** 开发环境默认域名 */
  Dev = 'Dev',
  /** 生产环境默认域名 */
  Prod = 'Prod',
  /** 用户自定义域名 */
  Custom = 'Custom',
}

/** 全栈应用绑定的域名(domain/list 回包行) */
export interface UserAppDomainInfo {
  /** 记录 ID */
  id: number;
  /** 商户 ID */
  tenantId: number;
  /** 应用 ID */
  appId: number;
  /** 域名 */
  domain: string;
  /** 域名类型 */
  domainType: UserAppDomainTypeEnum;
  /** 创建时间 */
  created: string;
  /** 更新时间 */
  modified: string;
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
  status: UserAppTaskStatusEnum;
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

/** 发布 / 启动 / 部署任务流程阶段 */
export type UserAppPublishPhase =
  | 'idle'
  | 'starting'
  | 'building'
  | 'checkingDeployable'
  | 'deploying'
  | 'success'
  | 'failed'
  | 'cancelled';

/** 进度弹窗失败发生在构建、检测可部署还是启动 */
export type UserAppDeployFailedStage = 'build' | 'check' | 'deploy';

/** 任务终态 */
export type UserAppTaskTerminalStatus = 'succeeded' | 'failed' | 'cancelled';

/**
 * 任务进度 SSE 事件名（与 event 字段一致）。
 * building / log / build_ok / build_fail 为构建服务级；
 * service_starting / service_start_ok 仅开发环境启动 / 重启服务时出现；
 * completed / failed / cancelled 为任务终态；stream_lagged 需带 fromSeq 重连。
 */
export type UserAppBuildSseEventName =
  | 'building'
  | 'log'
  | 'build_ok'
  | 'build_fail'
  | 'service_starting'
  | 'service_start_ok'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'stream_lagged';

/**
 * 单个服务进度状态。
 * 构建：building → build_ok / build_fail；
 * 开发环境启动：service_starting → service_start_ok。
 */
export type UserAppBuildServiceStatus =
  | 'building'
  | 'build_ok'
  | 'build_fail'
  | 'service_starting'
  | 'service_start_ok';

/** 单个服务（serviceId）的构建 / 启动状态与日志 */
export interface UserAppTaskServiceProgress {
  /** 服务 ID，如 web / api / backend-go */
  serviceId: string;
  /** 服务状态 */
  status: UserAppBuildServiceStatus;
  /** 日志行 */
  logs: string[];
}

/** 任务进度 SSE 事件（与协议 event 字段一致） */
export interface UserAppTaskLogEvent {
  seq?: number;
  serviceId?: string;
  service?: string;
  log?: string;
  line?: string;
  error?: string;
  skipped?: number;
  type?: UserAppBuildSseEventName | string;
  [key: string]: unknown;
}
