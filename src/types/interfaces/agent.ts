import type {
  AgentComponentTypeEnum,
  AssistantRoleEnum,
  BindValueType,
  ConversationEventTypeEnum,
  InputTypeEnum,
  InvokeTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
  NoneRecallReplyTypeEnum,
  SearchStrategyEnum,
  TriggerComponentType,
  TriggerTypeEnum,
} from '@/types/enums/agent';
import type {
  DataTypeEnum,
  PublishStatusEnum,
  TooltipTitleTypeEnum,
} from '@/types/enums/common';
import type { UpdateModeComponentEnum } from '@/types/enums/library';
import type {
  HistoryActionTypeEnum,
  HistoryTargetTypeEnum,
  OpenCloseEnum,
} from '@/types/enums/space';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import React from 'react';

// 知识库设置label
export interface LabelIconProps {
  label: string;
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
  agentId: number;
  spaceId: number;
}

// 新增智能体输入参数
export interface AgentAddParams extends AgentBaseInfo {
  spaceId: number;
}

// 智能体迁移接口输入参数
export interface AgentTransferParams {
  agentId: number;
  targetSpaceId: number;
}

// 智能体发布申请输入参数
export interface AgentPublishApplyParams {
  agentId: number;
  channels: string[];
  remark: string[];
}

// 更新智能体基础配置信息输入参数
export interface AgentConfigUpdateParams extends AgentBaseInfo {
  id: number;
  systemPrompt: string;
  userPrompt: string;
  openSuggest: string;
  suggestPrompt: string;
  openingChatMsg: string;
  openingGuidQuestion: string;
  openLongMemory: string;
}

// 出参、入参绑定配置，带下级, 绑定组件配置，不同组件配置不一样
export interface BindConfigWithSub {
  key: React.Key;
  // 参数名称，符合函数命名规则
  name: string;
  // 参数详细描述信息
  description: string;
  // 数据类型
  dataType?: DataTypeEnum;
  // 是否必须
  require?: boolean;
  // 是否为开启，如果不开启，插件使用者和大模型均看不见该参数；如果bindValueType为空且require为true时，该参数必须开启
  enable?: boolean;
  // 是否为系统内置变量参数，内置变量前端只可展示不可修改
  systemVariable?: boolean;
  // 值引用类型，Input 输入；Reference 变量引用,可用值:Input,Reference
  bindValueType?: BindValueType;
  // 参数值，当类型为引用时，示例 1.xxx 绑定节点ID为1的xxx字段；当类型为输入时，该字段为最终使用的值
  bindValue?: string;
  // 输入类型, Http插件有用,可用值:Query,Body,Header,Path
  inputType?: InputTypeEnum;
  subArgs?: BindConfigWithSub[];
  children?: BindConfigWithSub[];
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
  targetId: number;
  exceptionOut?: string;
  fallbackMsg?: string;
}

// 更新工作流组件配置输入参数
export interface AgentComponentWorkflowUpdateParams
  extends AgentComponentBaseInfo {
  // 绑定组件配置，不同组件配置不一样
  bindConfig: {
    // 出参绑定配置，插件、工作流有效
    argBindConfigs: BindConfigWithSub[];
    // 卡片ID
    cardId: string;
    // 卡片参数绑定信息
    cardArgsBindConfigs: {
      // 卡片参数名称key
      key: string;
      // 卡片参数引用信息，例如插件的出参 data.xxx
      bindValue: string;
    }[];
  };
}

// 更新变量配置输入参数
export interface AgentComponentVariableUpdateParams
  extends AgentComponentBaseInfo {
  bindConfig: {
    variables: BindConfigWithSub[];
  };
}

// 更新触发器组件配置输入参数
export interface AgentComponentTriggerUpdateParams
  extends AgentComponentBaseInfo {
  bindConfig: AgentComponentTriggerAddParams;
}

// 新增智能体触发器配置输入参数
export interface AgentComponentTriggerAddParams {
  name: string;
  // 触发类型,TIME 定时触发, EVENT 事件触发,可用值:TIME,EVENT
  triggerType: TriggerTypeEnum;
  timeZone: string;
  timeCronExpression: string;
  timeCronDesc: string;
  eventBearerToken: string;
  eventArgs: BindConfigWithSub[];
  // 触发器执行的组件类型,可用值:PLUGIN,WORKFLOW
  componentType: TriggerComponentType;
  // 触发器执行的组件名称
  componentName: string;
  // 触发器执行的组件ID
  componentId: string;
  // 出参绑定配置，插件、工作流有效
  argBindConfigs: BindConfigWithSub[];
  agentId: number;
}

// 更新插件组件配置
export type AgentComponentPluginUpdateParams =
  AgentComponentWorkflowUpdateParams;

// 智能体组件模型设置
export interface ComponentModelBindConfig {
  mode: UpdateModeComponentEnum;
  // 生成随机性;0-1
  temperature: number;
  // 累计概率: 模型在生成输出时会从概率最高的词汇开始选择;0-1
  topP: number;
  // 最大生成长度
  maxTokens: number;
  // 上下文轮数
  contextRounds: number;
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
  targetId: number;
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
  // 问题建议提示词
  suggestPrompt: string;
  // 首次打开聊天框自动回复消息
  openingChatMsg: string;
  // 首次打开引导问题
  openingGuidQuestion: string;
  // 是否开启长期记忆,可用值:Open,Close
  openLongMemory: OpenCloseEnum;
  // 发布状态,可用值:Developing,Applying,Published,Rejected
  publishStatus: PublishStatusEnum;
  modified: string;
  created: string;
  // 模型信息
  modelComponentConfig: AgentComponentInfo;
  // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
  agentStatistics: AgentStatisticsInfo;
  // 创建者信息
  creator: CreatorInfo;
  space: SpaceInfo;
  devCollected: boolean;
  // 会话ID
  devConversationId: number;
}

// 触发器时区
export interface TriggerTimeZone {
  // UTC时区列表
  utcTimeZones: {
    // UTC时区
    utc: string;
    timeZones: {
      // 时区
      timeZone: string;
      // 时区名称
      name: string;
    }[];
  }[];
  // 时间范围列表
  cronExpScopes: {
    // 时间范围
    scope: string;
    cronExps: {
      // 时间描述
      time: string;
      // 表达式
      expression: string;
    }[];
  }[];
}

// 智能体历史配置信息
export interface AgentConfigHistoryInfo {
  id: number;
  // 可用值:Agent,Plugin,Workflow
  targetType: HistoryTargetTypeEnum;
  targetId: number;
  // 操作类型,Add 新增, Edit 编辑, Publish 发布,可用值:Add,Edit,Publish,PublishApply,PublishApplyReject,OffShelf,AddComponent,EditComponent,DeleteComponent,AddNode,EditNode,DeleteNode
  type: HistoryActionTypeEnum;
  // 当时的配置信息
  config: string;
  description: string;
  // 操作人
  opUser: CreatorInfo;
  modified: string;
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
  agentId: number;
  // 组件类型,可用值:Plugin,Workflow,Trigger,Knowledge,Variable,Database,Model
  type: AgentComponentTypeEnum;
  // 绑定组件配置，不同组件配置不一样
  bindConfig: any;
  // 关联的组件ID
  targetId: number;
  // 组件原始配置
  targetConfig: string;
  exceptionOut: string;
  fallbackMsg: string;
  modified: string;
  created: string;
}

// 根据用户消息更新会话主题输入参数
export interface AgentConversationUpdateParams {
  // 会话ID
  id: number;
  // 用户第一条消息
  firstMessage: string;
}

export interface MessageInfo {
  // assistant 模型回复；user 用户消息,可用值:USER,ASSISTANT,SYSTEM,FUNCTION
  role: AssistantRoleEnum;
  // 可用值:CHAT,GUID,QUESTION,ANSWER
  type: MessageModeEnum;
  // 消息内容，其中附件放在.*?标签中
  text: string;
  // 消息时间
  time: string;
  metadata: object;
  // 可用值:USER,ASSISTANT,SYSTEM,TOOL
  messageType: MessageTypeEnum;
  chatFinalResult?: ConversationChatFinalResult;
}

// 查询会话信息
export interface AgentConversationInfo {
  // 会话ID
  id: number;
  userId: number;
  // 会话UUID
  uid: string;
  // 智能体ID
  agentId: number;
  // 会话主题
  topic: string;
  // 会话摘要，当开启长期记忆时，会对每次会话进行总结
  summary: string;
  modified: string;
  created: string;
  agent: {
    spaceId: number;
    // 目标对象（智能体、工作流、插件）ID,可用值:Agent,Plugin,Workflow,Knowledge
    targetType: string;
    // 目标对象（智能体、工作流、插件）ID
    targetId: number;
    // 发布名称
    name: string;
    // 描述
    description: string;
    // 图标
    icon: string;
    remark: string;
    // 智能体发布修改时间
    modified: string;
    // 智能体发布创建时间
    created: string;
    // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
    statistics: AgentStatisticsInfo;
    // 发布者信息
    publishUser: CreatorInfo;
    // 分类名称
    category: string;
    collect: boolean;
  };
  // 会话消息列表，会话列表查询时不会返回该字段值
  messageList: MessageInfo[];
}

// 查询用户历史会话输入参数
export interface AgentConversationListParams {
  agentId: number;
}

// 卡片信息
export interface AgentCardInfo {
  id: number;
  cardKey: string;
  name: string;
  imageUrl: string;
  argList: {
    key: string;
    placeholder: string;
  }[];
}

// 附加文件信息
export interface AttachmentFile {
  fileKey: string;
  // 文件URL
  fileUrl: string;
  // 文件名
  fileName: string;
  // 文件类型
  mimeType: string;
}

// 智能体会话输入参数
export interface AgentConversationChatParams {
  // 会话唯一标识
  conversationId: number;
  // 变量参数，前端需要根据agent配置组装参数
  variableParams: object;
  // chat消息
  message: string;
  // 附件列表
  attachments: AttachmentFile[];
  // 是否调试模式
  debug: boolean;
}

// 会话聊天消息
export interface ConversationChatMessage {
  ext: string;
  finished: boolean;
  id: string;
  // 可用值:USER,ASSISTANT,SYSTEM,TOOL
  messageType: MessageTypeEnum;
  metadata: object;
  // assistant 模型回复；user 用户消息,可用值:USER,ASSISTANT,SYSTEM,FUNCTION
  role: AssistantRoleEnum;
  text: string;
  time: number;
  // 可用值:CHAT,GUID,QUESTION,ANSWER
  type: MessageModeEnum;
}

// 会话聊天"FINAL_RESULT"
export interface ConversationChatFinalResult {
  completionTokens: number;
  componentExecuteResults: string[];
  endTime: number;
  error: string;
  outputText: string;
  promptTokens: number;
  startTime: number;
  success: boolean;
  totalTokens: number;
}

// 会话聊天响应数据
export interface ConversationChatResponse {
  completed: boolean;
  data: ConversationChatMessage | ConversationChatFinalResult;
  error: string;
  eventType: ConversationEventTypeEnum;
  requestId: string;
}

// 智能体会话问题建议输入参数
export type AgentConversationChatSuggestParams = AgentConversationChatParams;

// 创建会话输入参数
export interface AgentConversationCreateParams {
  // 智能体ID
  agentId: number;
  // 开发模式
  devMode: boolean;
}
