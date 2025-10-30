/**
 * AppDev 相关类型定义
 * 基于OpenAPI规范的用户前端页面项目内容接口
 */

import { MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { RequestResponse } from '@/types/interfaces/request';
import { DataResource } from './dataResource';

/**
 * 项目文件信息接口
 */
export interface ProjectFileInfo {
  /** 文件名 */
  name: string;
  /** 文件内容 */
  contents?: string;
  /** 是否为二进制文件 */
  binary: boolean;
  /** 文件大小 */
  size: number;
}

/**
 * 查询项目文件内容响应接口
 */
export interface ProjectContentRes {
  /** 项目文件内容对象 */
  files: Record<string, any> | ProjectFileInfo[];
}

/**
 * 查询项目文件内容请求参数接口
 */
export interface GetProjectContentParams {
  /** 项目ID */
  projectId: string;
}

/**
 * 查询项目文件内容API响应类型
 */
export type GetProjectContentResponse = RequestResponse<ProjectContentRes>;

/**
 * 开发环境状态枚举
 */
export enum DevServerStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  STARTING = 'starting',
  ERROR = 'error',
}

/**
 * 开发服务器信息接口
 * 实际 start-dev 接口返回格式: { projectId, projectIdStr, devServerUrl, prodServerUrl }
 */
export interface DevServerInfo {
  /** 项目ID */
  projectId: number;
  /** 项目ID字符串 */
  projectIdStr: string;
  /** 开发服务器URL */
  devServerUrl: string;
  /** 生产服务器URL */
  prodServerUrl: string | null;
}

/**
 * 项目构建信息接口
 */
export interface BuildInfo {
  /** 项目ID */
  projectId: string | number;
  /** 构建ID */
  buildId: string;
  /** 构建状态 */
  status: 'running' | 'completed' | 'failed';
  /** 构建耗时（秒） */
  buildTime?: number;
}

/**
 * 前端项目构建请求体
 */
export interface CustomBuildReq {
  /** 项目ID */
  projectId: string;
}

/**
 * 前端项目构建响应体
 */
export interface CustomBuildRes {
  /** 项目ID */
  projectId: number;
  /** 开发服务器URL */
  devServerUrl: string;
  /** 线上服务器URL */
  prodServerUrl: string;
}

/**
 * 构建API响应类型
 */
export type BuildResponse = RequestResponse<CustomBuildRes>;

/**
 * 创建项目参数接口
 */
export interface CreateProjectParams {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description?: string;
  /** 项目模板 */
  template?: string;
  /** 项目框架 */
  framework?: string;
}

/**
 * 上传并启动项目参数接口
 */
export interface UploadAndStartProjectParams {
  /** 项目压缩包文件 */
  file: File;
  /** 项目名称 */
  projectName: string;
  /** 项目ID，如果提供则更新现有项目 */
  projectId?: string;
  /** 空间ID */
  spaceId?: number;
  /** 项目描述 */
  projectDesc?: string;
  /** 项目图标 */
  icon?: string;
}

/**
 * 上传并启动项目返回数据接口
 */
export interface UploadAndStartProjectResponse {
  /** 项目ID */
  projectId: number;
  /** 项目ID字符串（因为后端接口返回的projectId太大时，精度丢失了） */
  projectIdStr: string;
  /** 开发服务器URL */
  devServerUrl: string;
}

/**
 * 页面文件信息接口（用于提交文件修改）
 */
export interface PageFileInfo {
  /** 文件名 */
  name: string;
  /** 文件内容 */
  contents?: string;
  /** 是否为二进制文件 */
  binary: boolean;
  /** 文件大小是否超限 */
  sizeExceeded?: boolean;
  /** 重命名之前的文件名（仅在重命名场景下使用） */
  renameFrom?: string;
}

/**
 * 提交项目修改请求参数接口
 */
export interface SubmitFilesParams {
  /** 项目ID */
  projectId: string;
  /** 文件列表 */
  files: PageFileInfo[];
}

/**
 * 提交项目修改API响应类型
 */
export type SubmitFilesResponse = RequestResponse<Record<string, any>>;

// ==================== 文件操作相关类型定义 ====================

/**
 * 删除文件请求参数接口
 */
export interface DeleteFileParams {
  /** 项目ID */
  projectId: string;
  /** 文件路径 */
  filePath: string;
}

/**
 * 重命名文件请求参数接口
 */
export interface RenameFileParams {
  /** 项目ID */
  projectId: string;
  /** 原文件路径 */
  oldPath: string;
  /** 新文件路径 */
  newPath: string;
}

/**
 * 文件操作结果接口
 */
export interface FileOperationResult {
  /** 操作是否成功 */
  success: boolean;
  /** 操作消息 */
  message: string;
  /** 操作的文件路径 */
  filePath?: string;
}

/**
 * 删除文件API响应类型
 */
export type DeleteFileResponse = RequestResponse<FileOperationResult>;

/**
 * 重命名文件API响应类型
 */
export type RenameFileResponse = RequestResponse<FileOperationResult>;

// ==================== AI聊天相关类型定义 ====================

/**
 * 附件数据源类型 - 基于 OpenAPI 规范
 */
export interface AttachmentSource {
  source_type: 'FilePath' | 'Base64' | 'Url';
  data: {
    path?: string; // FilePath
    data?: string; // Base64
    mime_type?: string; // Base64
    url?: string; // Url
  };
}

/**
 * 文件流附件 - 原型图片附件、其他附件文件
 */
export interface FileStreamAttachment {
  url: string;
  mimeType?: string;
  fileName?: string;
  fileKey?: string;
}

/**
 * 文本附件 - 基于 OpenAPI 规范
 */
export interface TextAttachment {
  id: string;
  description?: string;
  filename?: string;
  source: AttachmentSource;
}

/**
 * 图像尺寸信息 - 基于 OpenAPI 规范
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 图像附件 - 基于 OpenAPI 规范
 */
export interface ImageAttachment {
  id: string;
  description?: string;
  filename?: string;
  mime_type: string;
  dimensions?: ImageDimensions;
  source: AttachmentSource;
}

/**
 * 音频附件 - 基于 OpenAPI 规范
 */
export interface AudioAttachment {
  id: string;
  description?: string;
  filename?: string;
  mime_type: string;
  duration?: number;
  source: AttachmentSource;
}

/**
 * 文档附件 - 基于 OpenAPI 规范
 */
export interface DocumentAttachment {
  id: string;
  description?: string;
  filename?: string;
  mime_type: string;
  size?: number;
  source: AttachmentSource;
}

/**
 * 数据源附件 - 基于 OpenAPI 规范
 */
export interface DataSourceAttachment {
  id: string;
  description?: string;
  filename?: string;
  dataSourceId: number;
  type: 'plugin' | 'workflow';
  name: string;
}

/**
 * 附件类型 - 基于 OpenAPI 规范
 */
export type Attachment =
  | {
      type: 'Text';
      content: TextAttachment;
    }
  | {
      type: 'Image';
      content: ImageAttachment;
    }
  | {
      type: 'Audio';
      content: AudioAttachment;
    }
  | {
      type: 'Document';
      content: DocumentAttachment;
    }
  | {
      type: 'DataSource';
      content: DataSourceAttachment;
    };

/**
 * 模型提供商配置 - 基于 OpenAPI 规范
 */
export interface ModelProviderConfig {
  id: string;
  name: string;
  api_key: string;
  base_url: string;
  default_model: string;
  api_protocol?: 'anthropic' | 'openai';
  requires_openai_auth: boolean;
}

/**
 * 聊天请求参数 - 基于 OpenAPI 规范
 */
export interface ChatRequest {
  prompt: string;
  project_id?: string;
  session_id?: string;
  request_id?: string;
  chat_model_id: string; // 编码模型ID
  multi_model_id?: string; // 多模态模型ID（视觉模型ID）【可选】
  attachments?: Attachment[];
  data_sources?: DataSourceSelection[]; // 数据源附件列表 -[{dataSourceId:123,type:"plugin/workflow"}]
  model_provider?: ModelProviderConfig;
}

/**
 * 聊天响应数据
 */
export interface ChatResponseData {
  project_id: string;
  session_id: string;
  error?: string;
}

/**
 * 聊天API响应类型
 */
export type ChatResponse = RequestResponse<ChatResponseData>;

/**
 * 取消任务响应数据
 */
export interface CancelResponseData {
  session_id: string;
  success: boolean;
}

/**
 * 取消任务API响应类型
 */
export type CancelResponse = RequestResponse<CancelResponseData>;

/**
 * 停止Agent响应数据
 */
export interface StopAgentResponseData {
  project_id: string;
  session_id?: string;
  success: boolean;
  message: string;
}

/**
 * 停止Agent API响应类型
 */
export type StopAgentResponse = RequestResponse<StopAgentResponseData>;

/**
 * 会话消息类型枚举
 */
export enum SessionMessageType {
  SESSION_PROMPT_START = 'sessionPromptStart',
  SESSION_PROMPT_END = 'sessionPromptEnd',
  AGENT_SESSION_UPDATE = 'agentSessionUpdate',
  HEARTBEAT = 'heartbeat',
}

/**
 * 统一会话消息结构
 */
export interface UnifiedSessionMessage {
  type:
    | 'success'
    | 'error'
    | 'progress'
    | 'heartbeat'
    | 'agent_message_chunk'
    | 'tool_call'
    | 'tool_call_update'
    | 'agent_message_chunk'
    | 'plan'
    | 'session_id';
  sessionId: string;
  messageType: SessionMessageType;
  subType: string;
  data: any;
  timestamp: string;
  message: string;
  code?: string;
  [key: string]: any;
}

/**
 * SessionPromptStart 数据结构
 */
export interface SessionPromptStartData {
  type: 'prompt_start';
  prompt: string;
  attachments?: Array<{
    type: string;
    content: string;
  }>;
  user_id: string;
  project_id?: string;
}

/**
 * SessionPromptEnd 数据结构
 */
export interface SessionPromptEndData {
  stop_reason: 'end_turn' | 'max_tokens' | 'cancelled' | 'error';
  message: string;
  error_message?: string;
  suggestion?: string;
  tool_calls?: Array<{
    name: string;
    status: string;
    duration_ms?: number;
  }>;
  total_tokens?: number;
  duration_ms?: number;
  progress?: number;
}

/**
 * Agent思考过程数据
 */
export interface AgentThoughtData {
  thinking: string;
  confidence?: number;
}

/**
 * Agent文本响应数据
 */
export interface AgentMessageData {
  content: {
    type: 'text';
    text: string;
  };
  is_final: boolean;
}

/**
 * 工具调用数据
 */
export interface ToolCallData {
  tool_call: {
    name: string;
    arguments: Record<string, any>;
    tool_call_id: string;
  };
  status: 'started' | 'completed' | 'failed';
}

/**
 * 工具调用更新数据
 */
export interface ToolCallUpdateData {
  tool_call_id: string;
  result: {
    status: 'success' | 'error';
    output?: any;
    error_message?: string;
  };
}

/**
 * 心跳数据
 */
export interface HeartbeatData {
  type: 'heartbeat';
  message: 'keep-alive';
  timestamp: string;
}

/**
 * SSE事件类型
 */
export type SSEEventType =
  | 'prompt_start'
  | 'prompt_end'
  | 'user_message_chunk'
  | 'agent_message_chunk'
  | 'agent_thought_chunk'
  | 'tool_call'
  | 'tool_call_update'
  | 'available_commands_update'
  | 'heartbeat';

/**
 * SSE消息格式
 */
export interface SSEMessage {
  event: SSEEventType;
  data: UnifiedSessionMessage;
}

// ==================== 聊天消息相关类型定义 ====================

/**
 * Plan 条目
 */
export interface PlanEntry {
  content: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Tool Call 位置信息
 */
export interface ToolCallLocation {
  line: number;
  path: string;
  type: 'ToolCallLocation';
}

/**
 * Tool Call 信息
 */
export interface ToolCallInfo {
  toolCallId: string;
  title: string;
  kind: 'read' | 'edit' | 'write' | 'execute';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  content?: string;
  locations?: ToolCallLocation[];
  rawInput?: Record<string, any>;
  timestamp: string;
}

/**
 * AppDev 聊天消息接口
 * 用于区分用户和 Agent 角色的多轮对话消息
 */
export interface AppDevChatMessage {
  /** 消息唯一ID */
  id: string;
  /** 消息角色: USER | ASSISTANT */
  role: 'USER' | 'ASSISTANT';
  /** 消息类型: CHAT, THINK, QUESTION, ANSWER */
  type: MessageModeEnum;
  /** 消息文本内容 */
  text: string;
  /** AI 思考过程 */
  think?: string;
  /** 消息时间 */
  time: string;
  /** 消息状态: Loading, Incomplete, Complete, Error */
  status: MessageStatusEnum | null;
  /** 请求ID(关联问答对) */
  requestId: string;
  /** 会话ID */
  sessionId?: string;
  /** 是否正在流式传输 */
  isStreaming?: boolean;
  /** 时间戳（用于排序） */
  timestamp?: Date;
  /** 会话主题（历史消息专用） */
  conversationTopic?: string;
  /** 会话创建时间（历史消息专用） */
  conversationCreated?: string;
  /** 消息附件（图片、文件等） */
  attachments?: Attachment[];
  /** 原型图片附件列表 */
  attachmentPrototypeImages?: FileStreamAttachment[];
  /** 数据源附件列表 */
  dataSources?: DataSourceSelection[];
}

// ==================== 文件管理相关类型定义 ====================

/**
 * 文件节点类型
 */
export interface FileNode {
  /** 文件ID（完整路径） */
  id: string;
  /** 文件名 */
  name: string;
  /** 节点类型 */
  type: 'file' | 'folder';
  /** 文件路径 */
  path: string;
  /** 子节点 */
  children?: FileNode[];
  /** 是否为二进制文件 */
  binary?: boolean;
  /** 文件大小 */
  size?: number;
  /** 文件状态 */
  status?: string | null;
  /** 完整路径 */
  fullPath?: string;
  /** 父路径 */
  parentPath?: string | null;
  /** 文件内容 */
  content?: string;
  /** 最后修改时间 */
  lastModified?: number;
  /** 文件大小是否超限 */
  sizeExceeded?: boolean;
}

/**
 * 文件内容状态
 */
export interface FileContentState {
  /** 当前选中的文件ID */
  selectedFile: string;
  /** 文件内容 */
  fileContent: string;
  /** 原始文件内容 */
  originalFileContent: string;
  /** 是否正在加载文件内容 */
  isLoadingFileContent: boolean;
  /** 文件内容加载错误 */
  fileContentError: string | null;
  /** 文件是否被修改 */
  isFileModified: boolean;
  /** 是否正在保存文件 */
  isSavingFile: boolean;
}

/**
 * 文件树状态
 */
export interface FileTreeState {
  /** 文件树数据 */
  data: FileNode[];
  /** 展开的文件夹ID集合 */
  expandedFolders: Set<string>;
  /** 文件树是否折叠 */
  isCollapsed: boolean;
  /** 最后加载的项目ID */
  lastLoadedProjectId: string | null;
}

/**
 * 聊天消息类型
 */
export interface ChatMessage {
  id: string;
  type: 'ai' | 'user' | 'button' | 'section' | 'thinking' | 'tool_call';
  content?: string;
  timestamp?: Date;
  action?: string;
  title?: string;
  items?: string[];
  isExpanded?: boolean;
  details?: string[];
  sessionId?: string;
  isStreaming?: boolean;
}

// ==================== 项目详情相关类型定义 ====================

/**
 * 代理配置后端信息
 */
export interface ProxyConfigBackend {
  /** 后端地址 */
  backend: string;
  /** 权重 */
  weight: number;
}

/**
 * 代理配置
 */
export interface ProxyConfig {
  /** 环境类型 */
  env: 'dev' | 'prod';
  /** 路径 */
  path: string;
  /** 后端配置列表 */
  backends: ProxyConfigBackend[];
  /** 健康检查路径 */
  healthCheckPath?: string;
  /** 是否需要认证 */
  requireAuth: boolean;
}

/**
 * 下拉选项配置
 */
export interface SelectOption {
  /** 选项标签 */
  label: string;
  /** 选项值 */
  value: string;
  /** 子选项 */
  children?: SelectOption[];
}

/**
 * 下拉参数配置
 */
export interface SelectConfig {
  /** 数据源类型 */
  dataSourceType: 'MANUAL' | 'BINDING';
  /** 目标类型 */
  targetType: 'Agent' | 'Plugin' | 'Workflow' | 'Knowledge' | 'Table';
  /** 目标ID */
  targetId: number;
  /** 目标名称 */
  targetName: string;
  /** 目标描述 */
  targetDescription: string;
  /** 目标图标 */
  targetIcon: string;
  /** 下拉选项配置 */
  options: SelectOption[];
}

/**
 * 参数配置
 */
export interface Arg {
  /** 参数key，唯一标识 */
  key: string;
  /** 参数名称 */
  name: string;
  /** 参数展示名称 */
  displayName: string;
  /** 参数详细描述信息 */
  description: string;
  /** 数据类型 */
  dataType: string;
  /** 是否必须 */
  require: boolean;
  /** 是否为开启 */
  enable: boolean;
  /** 是否为系统内置变量参数 */
  systemVariable: boolean;
  /** 值引用类型 */
  bindValueType: 'Input' | 'Reference';
  /** 参数值 */
  bindValue: string;
  /** 下级参数 */
  subArgs: Arg[];
  /** 输入类型 */
  inputType: string;
  /** 下拉参数配置 */
  selectConfig?: SelectConfig;
  /** 循环ID */
  loopId?: number;
  /** 子参数 */
  children?: Arg[];
}

/**
 * 页面参数配置
 */
export interface PageArgConfig {
  /** 页面ID */
  pageId: number;
  /** 页面基础路径 */
  basePath: string;
  /** 页面路径 */
  pageUri: string;
  /** 页面名称 */
  name: string;
  /** 页面描述 */
  description: string;
  /** 参数列表 */
  args: Arg[];
}

/**
 * 版本信息项
 */
export interface VersionInfoItem {
  /** 版本时间 */
  time: string;
  /** 操作类型 */
  action: 'chat' | 'submit_files_update' | 'build' | 'deploy';
  /** 版本号 */
  version: number;
}

/**
 * 项目详情数据
 */
export interface ProjectDetailData {
  /** 项目ID */
  projectId: number;
  /** 项目ID字符串 */
  projectIdStr: string;
  /** 调试关联智能体ID */
  devAgentId: number;
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description: string;
  /** 项目图标 */
  icon: string;
  /** 项目基础路径 */
  basePath: string;
  /** 发布状态,true:已发布;false:未发布 */
  buildRunning: boolean;
  /** 发布时间 */
  buildTime: string;
  /** 发布版本 */
  buildVersion: number;
  /** 代码版本 */
  codeVersion: number;
  // 发布类型,可用值:AGENT,PAGE
  publishType: 'AGENT' | 'PAGE';
  /** 版本信息 */
  versionInfo: VersionInfoItem[];
  // 上次对话模型ID(编码模型ID)
  lastChatModelId: number;
  // 上次多模态ID(视觉模型ID)
  lastMultiModelId: number;
  // 是否需要登录,true:需要,false:不需要
  needLogin: boolean;
  /** 项目类型 */
  projectType: 'REVERSE_PROXY' | 'ONLINE_DEPLOY';
  /** 代理配置 */
  proxyConfigs: ProxyConfig[];
  /** 页面参数配置 */
  pageArgConfigs: PageArgConfig[];
  /** 数据源列表 */
  dataSources: DataResource[];
  /** 扩展字段 */
  ext: Record<string, any>;
  /** 租户ID */
  tenantId: number;
  /** 空间ID */
  spaceId: number;
  /** 创建时间 */
  created: string;
  /** 创建者ID */
  creatorId: number;
  /** 创建者名称 */
  creatorName: string;
  /** 创建者昵称 */
  creatorNickName: string;
  /** 创建者头像 */
  creatorAvatar: string;
}

/**
 * 项目详情API响应类型
 */
export type ProjectDetailResponse = RequestResponse<ProjectDetailData>;

/**
 * 部署状态枚举
 */
export enum DeployStatus {
  /** 未发布 */
  NOT_DEPLOYED = -1,
  /** 已发布 */
  DEPLOYED = 1,
}

/**
 * 项目类型枚举
 */
export enum ProjectType {
  /** 反向代理 */
  REVERSE_PROXY = 'REVERSE_PROXY',
  /** 在线部署 */
  ONLINE_DEPLOY = 'ONLINE_DEPLOY',
}

// ==================== 会话管理相关类型定义 ====================

/**
 * 会话记录信息
 */
export interface ConversationRecord {
  projectId: number;
  sessionId: string;
  content: string;
  topic: string;
  summary?: string;
  created: string;
  creatorId: number;
}

/**
 * 保存会话请求参数
 */
export interface SaveConversationParams {
  projectId: number;
  sessionId: string;
  content: string;
  topic: string;
  summary?: string;
}

/**
 * 查询会话列表响应
 */
export type ListConversationsResponse = RequestResponse<ConversationRecord[]>;

// ==================== Agent服务管理相关类型定义 ====================

/**
 * Agent服务状态响应数据
 */
export interface AgentStatusResponseData {
  /** Agent服务是否正在运行 */
  is_alive: boolean;
  /** Agent服务状态 */
  status: string;
  /** 会话ID（如果正在运行） */
  session_id?: string;
  /** 项目ID */
  project_id?: string;
}

/**
 * Agent服务状态API响应类型
 */
export type AgentStatusResponse = RequestResponse<AgentStatusResponseData>;

/**
 * 停止Agent服务API响应类型
 */
export type StopAgentServiceResponse = RequestResponse<Record<string, any>>;

// ==================== 数据源绑定相关类型定义 ====================

/**
 * 数据源选择接口
 */
export interface DataSourceSelection {
  /** 数据源ID */
  dataSourceId: number;
  /** 数据源类型：plugin-插件, workflow-工作流 */
  type: 'plugin' | 'workflow';
  /** 数据源名称 */
  name: string;
}

/**
 * 绑定数据源请求参数接口
 */
export interface BindDataSourceRequest {
  /** 项目ID */
  projectId: number;
  /** 数据源类型：plugin-插件, workflow-工作流 */
  type: 'plugin' | 'workflow';
  /** 数据源ID */
  dataSourceId: number;
}

/**
 * 解绑数据源请求参数接口
 */
export interface UnbindDataSourceRequest {
  /** 项目ID */
  projectId: number;
  /** 数据源类型：plugin-插件, workflow-工作流 */
  type: 'plugin' | 'workflow';
  /** 数据源ID */
  dataSourceId: number;
}

// ==================== 保活接口相关类型定义 ====================

/**
 * 保活接口响应数据
 */
export interface KeepAliveResponseData {
  /** 项目ID */
  projectId: number;
  /** 项目ID字符串 */
  projectIdStr: string;
  /** 开发服务器URL（可能更新） */
  devServerUrl: string;
}

/**
 * 保活接口API响应类型
 */
export type KeepAliveResponse = RequestResponse<KeepAliveResponseData>;

// ==================== 模型管理相关类型定义 ====================

/**
 * 模型配置信息
 */
export interface ModelConfig {
  /** 模型ID */
  id: number;
  /** 模型名称 */
  name: string;
  /** 模型描述 */
  description?: string;
  /** 模型标识 */
  model: string;
  /** 模型接口协议 */
  apiProtocol: 'OpenAI' | 'Ollama' | 'Zhipu' | 'Anthropic';
  /** 租户ID */
  tenantId: number;
  /** 空间ID */
  spaceId: number;
  /** 是否为推理模型 */
  isReasonModel: number;
  /** token上限 */
  maxTokens: number;
}

/**
 * 模型列表API响应类型
 */
export interface ModelLisDto {
  /** 编码模型列表 */
  chatModelList: ModelConfig[];
  // 多模态模型列表
  multiModelList: ModelConfig[];
}

/**
 * 查询模型列表API响应类型
 */
export type ListModelsResponse = RequestResponse<ModelLisDto>;

// ==================== 开发服务器日志相关类型定义 ====================

/**
 * 日志级别枚举
 */
export enum LogLevel {
  /** 普通信息 */
  NORMAL = 'NORMAL',
  /** 信息 */
  INFO = 'INFO',
  /** 警告 */
  WARN = 'WARN',
  /** 错误 */
  ERROR = 'ERROR',
}

/**
 * 开发服务器日志条目接口
 */
export interface DevLogEntry {
  /** 行号 */
  line: number;
  /** 时间戳 [2025/10/20 09:52:57] */
  timestamp?: string;
  /** 日志级别 */
  level: LogLevel;
  /** 原始内容 */
  content: string;
  /** 是否为错误 */
  isError?: boolean;
  /** 错误指纹（用于去重） */
  errorFingerprint?: string;
}

/**
 * 获取开发服务器日志请求参数接口
 */
export interface GetDevLogRequest {
  /** 项目ID */
  projectId: number;
  /** 起始行号 */
  startIndex: number;
}

/**
 * 获取开发服务器日志响应数据接口
 */
export interface GetDevLogResponse {
  /** 项目ID */
  projectId: number;
  /** 日志内容列表 */
  logs: DevLogEntry[];
  /** 总行数 */
  totalLines: number;
  /** 当前起始行号 */
  startIndex: number;
}

/**
 * 获取开发服务器日志API响应类型
 */
export type GetDevLogApiResponse = RequestResponse<GetDevLogResponse>;
