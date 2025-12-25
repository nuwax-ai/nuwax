import type {
  AgentApiKeyTargetEnum,
  AgentComponentTypeEnum,
  AllowCopyEnum,
  DefaultSelectedEnum,
  DevModeEnum,
  EventBindResponseActionEnum,
  ExpandPageAreaEnum,
  GuidQuestionSetTypeEnum,
  HideChatAreaEnum,
  HomeIndexEnum,
  InvokeTypeEnum,
  NoneRecallReplyTypeEnum,
  OutputDirectlyEnum,
  SearchStrategyEnum,
  VisibleToLLMEnum,
} from '@/types/enums/agent';
import type {
  PermissionsEnum,
  PublishStatusEnum,
  TooltipTitleTypeEnum,
} from '@/types/enums/common';
import type { UpdateModeComponentEnum } from '@/types/enums/library';
import type {
  AgentTypeEnum,
  HistoryActionTypeEnum,
  OpenCloseEnum,
} from '@/types/enums/space';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import React from 'react';
import { CardArgsBindConfigInfo } from './cardInfo';

// 知识库设置label
export interface LabelIconProps {
  className?: string;
  label: React.ReactNode;
  title: React.ReactNode;
  type?: TooltipTitleTypeEnum;
}

// 智能体基础信息
export interface AgentBaseInfo {
  name: string;
  icon: string;
  description: string;
}

// 智能体信息
export interface AgentInfo extends AgentBaseInfo {
  id: number;
  userId: number;
  modified: string;
  created: string;
  // 智能体ID
  agentId: number;
  spaceId: number;
  // ChatBot、PageApp
  agentType: 'ChatBot' | 'PageApp';
}

// 新增智能体输入参数
export interface AgentAddParams extends AgentBaseInfo {
  spaceId: number;
}

// 智能体发布申请输入参数
export interface AgentPublishApplyParams {
  agentId: number;
  channels: string[];
  remark: string[];
}

// 引导问题
export interface GuidQuestionDto {
  // 问题类型,可用值:Question,Page,Link
  type: GuidQuestionSetTypeEnum;
  // 问题信息
  info: string;
  // 图标
  icon?: string;
  // 链接地址，type类型为Link时有效
  url?: string;
  // 页面ID，type类型为Page时有效
  pageId?: number;
  // 页面基础路径，type类型为Page时有效
  basePath?: string;
  // 页面路径，type类型为Page时有效
  pageUri?: string;
  //页面地址，配置更新时不需要传递，type类型为Page时有效，完整的页面地址，前端需要使用 BASE_URL+pageUrl
  pageUrl?: string;
  // 参数
  args?: BindConfigWithSub[];
  // 参数值，配置更新时不需要传递，用户点击跳转时直接使用，type类型为Page时有效
  params?: any;
}

// 更新智能体基础配置信息输入参数
export interface AgentConfigUpdateParams extends AgentBaseInfo {
  id: number;
  // 系统提示词
  systemPrompt: string;
  // 用户消息提示词
  userPrompt: string;
  // 是否开启问题建议,可用值:Open,Close
  openSuggest: OpenCloseEnum;
  // 问题建议提示词
  suggestPrompt: string;
  // 首次打开聊天框自动回复消息
  openingChatMsg: string;
  // 首次打开引导问题(弃用)
  openingGuidQuestions: string[];
  // 引导问题
  guidQuestionDtos: GuidQuestionDto[];
  // 是否开启长期记忆,可用值:Open,Close
  openLongMemory: OpenCloseEnum;
  // 是否开启定时任务,可用值:Open,Close
  openScheduledTask: OpenCloseEnum;
  // 是否默认展开扩展页面区域, 1 展开；0 不展开
  expandPageArea: ExpandPageAreaEnum;
  // 是否隐藏聊天区域，1 隐藏；0 不隐藏
  hideChatArea: HideChatAreaEnum;
}

// 更新智能体页面配置输入参数
export interface AgentPageUpdateParams extends AgentBaseInfo {
  // 组件配置ID
  id: number;
  // 目标组件ID
  targetId: number;
  bindConfig: {
    // 自定义页面唯一标识
    basePath?: string;
    // 页面参数配置
    pageArgConfigs?: {
      // 页面路径，例如 /view
      pageUri: string;
      // 页面名称
      name: string;
      // 页面描述
      description: string;
      // 参数
      args: BindConfigWithSub[];
    }[];
    // 页面是否模型可见，1 可见，0 不可见
    visibleToLLM?: VisibleToLLMEnum;
    // 是否为智能体页面首页，1 为默认首页，0 不为首页
    homeIndex?: HomeIndexEnum;
  };
}

// 智能体事件绑定配置
export interface AgentComponentEventConfig {
  // 事件名称
  name: string;
  // 事件标识
  identification: string;
  // 事件类型, Link 外链；Page 扩展页面,可用值:Link,Page
  type: EventBindResponseActionEnum;
  // url 链接地址，type类型为Link时有效
  url: string;
  // 页面ID，type类型为Page时有效，更新时需要传入
  pageId: number;
  // 页面基础路径，type类型为Page时有效，不需要传入
  basePath: string;
  // 页面路径，type类型为Page时有效，更新时需要传入
  pageUri: string;
  // pageUrl 页面URL，type类型为Page时有效，不需要传入
  pageUrl: string;
  // 参数
  args: BindConfigWithSub[];
  // 参数配置JSON Schema，前端生成事件提示词时使用
  argJsonSchema: string;
}

// 更新事件绑定配置输入参数
export interface AgentComponentEventUpdateParams extends AgentBaseInfo {
  // 组件配置ID
  id: number;
  // 目标组件ID
  targetId?: number;
  // 事件绑定配置
  bindConfig: {
    eventConfigs: AgentComponentEventConfig;
  };
  exceptionOut?: number;
  fallbackMsg?: string;
}

// 智能体组件模型基础信息
export interface AgentComponentBaseInfo {
  // 组件配置ID
  id: number;
  // 组件名称
  name?: string;
  // 组件图标
  icon?: string;
  // 组件描述
  description?: string;
  // 目标组件ID
  targetId: number | null;
  // 异常时中断流程
  exceptionOut?: DefaultSelectedEnum;
  // 异常时输出给大模型的默认信息
  fallbackMsg?: string;
}

// 更新工作流组件配置输入参数
export interface AgentComponentWorkflowUpdateParams
  extends AgentComponentBaseInfo {
  // 绑定组件配置，不同组件配置不一样
  bindConfig: {
    // 是否默认选中，0-否，1-是
    async: DefaultSelectedEnum;
    // 异步执行时回复内容
    asyncReplyContent: string;
    // 入参绑定配置，插件、工作流有效
    inputArgBindConfigs: BindConfigWithSub[];
    // 出参绑定配置，插件、工作流有效
    outputArgBindConfigs: BindConfigWithSub[];
    // 调用方式
    invokeType: InvokeTypeEnum;
    // 是否直接输出, 0 否，1 是
    directOutput?: OutputDirectlyEnum;
    // 是否默认选中，0-否，1-是
    defaultSelected: DefaultSelectedEnum;
    // 卡片参数绑定信息
    cardArgsBindConfigs: CardArgsBindConfigInfo[];
  };
}

// 更新数据表组件配置输入参数
export interface AgentComponentTableUpdateParams
  extends AgentComponentBaseInfo {
  // 绑定组件配置，不同组件配置不一样
  bindConfig: {
    // 入参绑定配置，插件、工作流有效
    inputArgBindConfigs: BindConfigWithSub[];
    // 出参绑定配置，插件、工作流有效
    outputArgBindConfigs: BindConfigWithSub[];
    // 卡片参数绑定信息
    cardArgsBindConfigs: CardArgsBindConfigInfo[];
  };
}

// 更新变量配置输入参数
export interface AgentComponentVariableUpdateParams
  extends AgentComponentBaseInfo {
  bindConfig: {
    variables: BindConfigWithSub[];
  };
}

// 更新插件组件配置
export type AgentComponentPluginUpdateParams =
  AgentComponentWorkflowUpdateParams;

// 更新MCP组件配置输入参数
export interface AgentComponentMcpUpdateParams
  extends AgentComponentWorkflowUpdateParams {
  toolName: string;
}

// 更新技能组件配置输入参数
export interface AgentComponentSkillUpdateParams
  extends AgentComponentWorkflowUpdateParams {
  toolName: string;
}

// 智能体组件模型设置
export interface ComponentModelBindConfig {
  // 模式：Precision 精确模式；Balanced 平衡模式；Creative 创意模式；Customization 自定义,可用值:Precision,Balanced,Creative,Customization
  mode: UpdateModeComponentEnum;
  // 生成随机性;0-1
  temperature: number;
  // 累计概率: 模型在生成输出时会从概率最高的词汇开始选择;0-1
  topP: number;
  // 最大生成长度
  maxTokens: number;
  // 上下文轮数
  contextRounds: number;
  // 推理模型ID
  reasoningModelId: number | null;
}

// 更新模型组件配置输入参数
export interface AgentComponentModelUpdateParams
  extends AgentComponentBaseInfo {
  bindConfig: ComponentModelBindConfig;
}

// 知识库绑定组件配置
export interface KnowledgeBindConfig {
  // 调用方式,可用值:AUTO,ON_DEMAND
  invokeType: InvokeTypeEnum;
  // 搜索策略,可用值:SEMANTIC,MIXED,FULL_TEXT
  searchStrategy: SearchStrategyEnum;
  // 最大召回数量
  maxRecallCount: number;
  // 匹配度,0.01 - 0.99
  matchingDegree: number;
  // 无召回回复类型，默认、自定义,可用值:DEFAULT,CUSTOM
  noneRecallReplyType: NoneRecallReplyTypeEnum;
  // 无召回回复自定义内容
  noneRecallReply: string;
}

// 更新知识库组件配置输入参数
export interface AgentComponentKnowledgeUpdateParams
  extends AgentComponentBaseInfo {
  // 绑定组件配置，不同组件配置不一样
  bindConfig: KnowledgeBindConfig;
}

// 新增智能体插件、工作流、知识库组件配置输入参数
export interface AgentComponentAddParams {
  agentId: number;
  type: AgentComponentTypeEnum;
  targetId: number | string;
  toolName?: string;
}

// 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
export interface AgentStatisticsInfo {
  targetId: number;
  // 用户人数
  userCount: number;
  // 会话次数
  convCount: number;
  // 收藏次数
  collectCount: number;
  // 点赞次数
  likeCount: number;
  // 引用次数
  referenceCount: number;
  // 调用总次数
  callCount: number;
  // 失败调用次数
  failCallCount: number;
  // 调用总时长
  totalCallDuration: number;
}

// 创建者信息
export interface CreatorInfo {
  // 用户ID
  userId: number;
  // 用户名
  userName: string;
  // 昵称
  nickName: string;
  // 头像
  avatar: string;
}

// 智能体配置信息
export interface AgentConfigInfo {
  // 智能体ID
  id: number;
  // agent唯一标识
  uid: string;
  // 商户ID
  tenantId: number;
  spaceId: number;
  creatorId: number;
  // Agent名称
  name: string;
  // Agent描述
  description: string;
  // 图标地址
  icon: string;
  // 系统提示词
  systemPrompt: string;
  // 用户消息提示词
  userPrompt: string;
  // 是否开启问题建议,可用值:Open,Close
  openSuggest: OpenCloseEnum;
  // 是否开启定时任务,可用值:Open,Close
  openScheduledTask: OpenCloseEnum;
  // 问题建议提示词
  suggestPrompt: string;
  // 首次打开聊天框自动回复消息
  openingChatMsg: string;
  // 首次打开引导问题(弃用)
  openingGuidQuestions: string[];
  // 引导问题
  guidQuestionDtos: GuidQuestionDto[];
  // 是否开启长期记忆,可用值:Open,Close
  openLongMemory: OpenCloseEnum;
  // 发布状态,可用值:Developing,Applying,Published,Rejected
  publishStatus: PublishStatusEnum;
  // 最后编辑时间
  modified: string;
  // 创建时间
  created: string;
  // 模型信息
  modelComponentConfig: AgentComponentInfo;
  // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
  agentStatistics: AgentStatisticsInfo;
  // 智能体组件配置列表
  agentComponentConfigList: AgentComponentInfo[];
  // 发布者信息
  publishUser: CreatorInfo;
  // 创建者信息
  creator: CreatorInfo;
  // 返回的具体业务数据
  space: SpaceInfo;
  devCollected: boolean;
  // 会话ID
  devConversationId: number;
  // 发布时间，如果不为空，与当前modified时间做对比，如果发布时间小于modified，则前端显示：有更新未发布
  publishDate: string;
  // 发布备注
  publishRemark: string;
  // 智能体分类名称
  category: string;
  collected: boolean;
  // 权限列表
  permissions?: PermissionsEnum[];
  // 是否默认展开扩展页面区域, 1 展开；0 不展开
  expandPageArea: ExpandPageAreaEnum;
  // 是否隐藏聊天区域，1 隐藏；0 不隐藏
  hideChatArea: HideChatAreaEnum;
  // 扩展页面首页
  pageHomeIndex: string;
  // 智能体类型
  type: AgentTypeEnum;
}

// 智能体历史配置信息
export interface AgentConfigHistoryInfo {
  id: number;
  // 可用值:Agent,Plugin,Workflow
  targetType: AgentComponentTypeEnum;
  targetId: number;
  // 操作类型,Add 新增, Edit 编辑, Publish 发布,可用值:Add,Edit,Publish,PublishApply,PublishApplyReject,OffShelf,AddComponent,EditComponent,DeleteComponent,AddNode,EditNode,DeleteNode
  type: HistoryActionTypeEnum;
  // 当时的配置信息
  config: unknown;
  // 操作描述
  description: string;
  // 操作人
  opUser: CreatorInfo;
  modified: string;
  // 创建时间
  created: string;
}

// 智能体组件模型信息
export interface AgentComponentInfo {
  id: number;
  // 商户ID
  tenantId: number;
  // 组件名称
  name: string;
  // 组件图标
  icon: string;
  // 组件描述
  description: string;
  // 关联的AgentID
  agentId: number;
  // 组件类型,可用值:Plugin,Workflow,Trigger,Knowledge,Variable,Database,Model,Agent,Table,Mcp,Page,Event
  type: AgentComponentTypeEnum;
  // 绑定组件配置，不同组件配置不一样
  bindConfig: any;
  // 关联的组件ID
  targetId: number | null;
  spaceId: number;
  // 组件原始配置
  targetConfig: any;
  // 异常时中断流程
  exceptionOut: DefaultSelectedEnum;
  // 异常时输出给大模型的默认信息
  fallbackMsg: string;
  modified: string;
  created: string;
  // 分组描述
  groupDescription: string;
  // 分组名称
  groupName: string;
}

// 根据用户消息更新会话主题输入参数
export interface AgentConversationUpdateParams {
  // 会话ID
  id: number;
  // 用户第一条消息
  firstMessage?: string;
  // 会话主题
  topic?: string;
}

// 卡片列表参数
export interface ArgList {
  key: string;
  placeholder: string;
  // 自定义数据，用于页面渲染操作
  [key: string]: React.Key | boolean;
}

// 卡片信息
export interface AgentCardInfo {
  id: number;
  cardKey: string;
  name: string;
  imageUrl: string;
  argList: ArgList[];
}

// 配置手动选择组件信息
export interface AgentManualComponentInfo {
  // 组件ID
  id: number;
  // 组件名称
  name: string;
  // 组件图标
  icon: string;
  // 组件描述
  description: string;
  // 组件类型,可用值:Plugin,Workflow,Trigger,Knowledge,Variable,Database,Model,Agent,Table,Agent
  type: AgentComponentTypeEnum;
  // 是否默认选中，0-否，1-是
  defaultSelected: DefaultSelectedEnum;
}

// 配置已选择组件信息
export interface AgentSelectedComponentInfo {
  // 组件ID
  id: number;
  // 组件类型,可用值:Plugin,Workflow,Trigger,Knowledge,Variable,Database,Model,Agent,Table,Agent
  type: AgentComponentTypeEnum;
}

// Agent信息，已发布过的agent才有此信息
export interface AgentDetailDto extends AgentBaseInfo {
  // 会话ID
  conversationId: number;
  spaceId: number;
  // 智能体ID
  agentId: number;
  // 发布备注信息
  remark: string;
  // 智能体发布时间
  publishDate: number;
  // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
  statistics: AgentStatisticsInfo;
  // 发布者信息
  publishUser: CreatorInfo;
  // 智能体分类名称
  category: string;
  // 是否开启问题建议,可用值:Open,Close
  openSuggest: OpenCloseEnum;
  // 开场白文案
  openingChatMsg: string;
  // 首次打开引导问题（弃用）
  openingGuidQuestions: string[];
  // 引导问题
  guidQuestionDtos: GuidQuestionDto[];
  // 是否开启定时任务,可用值:Open,Close
  openScheduledTask: OpenCloseEnum;
  // 参数
  variables: BindConfigWithSub[];
  // 分享链接
  shareLink: string;
  // 可手动选择的组件列表
  manualComponents: AgentManualComponentInfo[];
  // 是否允许复制, 1 允许
  allowCopy: AllowCopyEnum;
  // 当前登录用户是否收藏
  collect: boolean;
  // 是否默认展开扩展页面区域, 1 展开；0 不展开
  expandPageArea: ExpandPageAreaEnum;
  // 是否隐藏聊天区域，1 隐藏；0 不隐藏
  hideChatArea: HideChatAreaEnum;
  // 扩展页面首页
  pageHomeIndex: string;
  // 智能体类型，ChatBot 问答型；TaskAgent 任务型; PageApp 页面应用智能体
  type: AgentTypeEnum;
}

// 日志查询过滤条件
export interface LogQueryFilter {
  // 智能体ID
  agentId: number;

  // 请求ID
  requestId?: string;

  // 消息ID
  messageId?: string;

  // 会话ID
  conversationId?: string;

  // 用户UID
  userUid?: string;

  // 用户输入,需要支持全文检索，支持多个关键字（AND关系）
  userInput?: string[];

  // 系统输出,需要支持全文检索，支持多个关键字（AND关系）
  output?: string[];

  // 开始时间
  startTime?: string;

  // 结束时间
  endTime?: string;

  // 租户ID，用于租户隔离，确保只查询特定租户的日志
  tenantId?: string;

  // 空间ID，可选，用于查询特定空间的日志，支持多个ID（OR关系）
  spaceId?: string[];
}

// 日志查询过滤条件-工作空间
export interface SpaceLogQueryFilter {
  // 来源，可用值:task_center
  from?: string;
  /** 请求唯一标识，可以用于关联一次请求中所有相关的操作 */
  requestId?: string;

  /** 日志产生对象所在的空间 ID */
  spaceId?: number;

  /** 请求发起的用户 ID */
  userId?: number;

  /** 用户名 */
  userName?: string;

  /** 日志对象类型，Agent、Plugin、Workflow、Mcp */
  targetType?: string;

  /** 日志对象名称 */
  targetName?: string;

  /** 日志对象 ID */
  targetId?: string;

  /** 会话 ID */
  conversationId?: string;

  /** 输入参数 */
  input?: string;

  /** 执行结果 */
  output?: string;

  /** 执行过程数据 */
  processData?: string;

  /** 执行结果码，0000 为成功 */
  resultCode?: string;

  /** 日志产生时间（大于） */
  createTimeGt?: number;

  /** 日志产生时间（小于） */
  createTimeLt?: number;
}

// 日志查询请求参数-工作空间
export interface apiSpaceLogListParams {
  /*分页查询过滤条件 */
  queryFilter?: SpaceLogQueryFilter;
  // 当前页,示例值(1)
  current: number;
  // 分页pageSize,示例值(10)
  pageSize: number;
}

// 日志详情请求参数-工作空间
export interface SpaceLogDetailParams {
  /** 请求唯一标识 */
  id: string;
}

// 日志查询响应-工作空间
export interface SpaceLogInfo {
  /** 日志 ID，不用于展示，仅用于查询详情 */
  id: string;

  /** 请求唯一标识，可用于关联一次请求中所有相关操作 */
  requestId: string;

  /** 日志产生对象所在的空间 ID */
  spaceId?: number;

  /** 请求发起的用户 ID */
  userId?: number;

  /** 用户名 */
  userName?: string;

  /** 日志对象类型 */
  targetType?: string;

  /** 日志对象名称 */
  targetName?: string;

  /** 日志对象 ID */
  targetId?: string;

  /** 会话 ID */
  conversationId?: string;

  /** 输入参数 */
  input?: string;

  /** 执行结果 */
  output?: string;

  /** 执行过程数据 */
  processData?: string;

  /** 输入 token 数量 */
  inputToken?: number;

  /** 输出 token 数量 */
  outputToken?: number;

  /** 请求开始时间（时间戳） */
  requestStartTime: number;

  /** 请求结束时间（时间戳） */
  requestEndTime: number;

  /** 执行结果码，0000 为成功 */
  resultCode?: string;

  /** 执行结果描述 */
  resultMsg?: string;

  /** 日志产生时间（时间戳） */
  createTime?: number;
}

// 日志查询详情响应-工作空间
export interface SpaceLogInfoDetail {
  /** 日志 ID */
  id: string;

  /** 请求唯一标识，可用于关联一次请求中所有相关操作 */
  requestId: string;

  /** 日志产生对象所在的空间 ID */
  spaceId: number;

  /** 请求发起的用户 ID */
  userId: number;

  /** 用户名 */
  userName: string;

  /** 日志对象类型 */
  targetType: string;

  /** 日志对象名称 */
  targetName: string;

  /** 日志对象 ID */
  targetId: string;

  /** 会话 ID */
  conversationId: string;

  /** 输入参数 */
  input: string;

  /** 执行结果 */
  output: string;

  /** 执行过程数据 */
  processData: string;

  /** 输入 token 数量 */
  inputToken: number;

  /** 输出 token 数量 */
  outputToken: number;

  /** 请求开始时间（时间戳） */
  requestStartTime: number;

  /** 请求结束时间（时间戳） */
  requestEndTime: number;

  /** 执行结果码，0000 为成功 */
  resultCode: string;

  /** 执行结果描述 */
  resultMsg: string;

  /** 日志产生时间（时间戳） */
  createTime: number;
}

// 日志查询请求参数
export interface apiAgentLogListParams {
  /*分页查询过滤条件 */
  queryFilter?: LogQueryFilter;
  // 当前页,示例值(1)
  current: number;
  // 分页pageSize,示例值(10)
  pageSize: number;
}

// 日志详情请求参数
export interface AgentLogDetailParams {
  requestId: string;
  agentId: number;
}

// 日志信息
export interface logInfo {
  // 请求ID，唯一标识一次请求
  requestId: string;

  // 消息ID
  messageId: string;

  // 智能体ID
  agentId: string;

  // 会话ID
  conversationId: string;

  // 用户UID（必填）
  userUid: string;

  // 商户ID
  tenantId: string;

  // 空间ID，用户可以有多个空间
  spaceId: string;

  // 用户输入
  userInput: string;

  // 系统输出的内容
  output: string;

  // 执行结果,扩展字段,字段类型存储的是json文本
  executeResult: string;

  // 输入token数量
  inputToken: number;

  // 输出token数量
  outputToken: number;

  // 请求时间
  requestStartTime: string;

  // 请求结束时间
  requestEndTime: string;

  // 整体耗时
  elapsedTimeMs: number;

  // 节点类型
  nodeType: string;

  // 节点状态
  status: string;

  // 节点名称
  nodeName: string;

  // 创建时间
  createdAt: string;

  // 更新时间
  updatedAt: string;

  // 用户ID
  userId: number;

  // 用户名称
  userName: string;
}

// 删除智能体APIKEY输入参数
export interface AgentAkDeleteParams {
  // 智能体ID
  agentId: number;
  // APIKEY
  accessKey: string;
}

// 更新智能体APIKEY是否为开发模式输入参数
export interface AgentAkUpdateParams extends AgentAkDeleteParams {
  // 开发模式，1 是，0 否
  devMode: DevModeEnum;
}

// 用户APIKEY信息
export interface UserApiKeyInfo {
  id: number;
  userId: number;
  // 可用值:Mcp,Agent,TempChat
  targetType: AgentApiKeyTargetEnum;
  targetId: number;
  accessKey: string;
  config: {
    // 是否开发模式,1 是；0 否
    isDevMode: DevModeEnum;
  };
  creator: {
    userId: number;
    userName: string;
  };
  created: string;
}

// 页面请求结果回写参数
export interface ApiAgentConversationChatPageResultParams {
  // 请求ID
  requestId: string;
  // 结果HTML
  html: string;
}
