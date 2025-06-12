import type {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  BindValueType,
  DefaultSelectedEnum,
  InputTypeEnum,
  InvokeTypeEnum,
  NoneRecallReplyTypeEnum,
  OptionDataSourceEnum,
  SearchStrategyEnum,
  TriggerComponentType,
  TriggerTypeEnum,
} from '@/types/enums/agent';
import type {
  DataTypeEnum,
  PermissionsEnum,
  PublishStatusEnum,
  TooltipTitleTypeEnum,
} from '@/types/enums/common';
import type { UpdateModeComponentEnum } from '@/types/enums/library';
import type { HistoryActionTypeEnum, OpenCloseEnum } from '@/types/enums/space';
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
  agentId: number;
  spaceId: number;
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
  // 首次打开引导问题
  openingGuidQuestions: string[];
  // 是否开启长期记忆,可用值:Open,Close
  openLongMemory: OpenCloseEnum;
}

// 输入、输出下拉选项配置信息
interface SelectConfigInfo {
  // 下拉选项名称
  label: string;
  // 下拉选项列表
  options: {
    // 选项名称
    name: string;
    children: SelectConfigInfo[];
  }[];
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
  // 输入类型 可用值:Query,Body,Header,Path,Text,Paragraph,Select,MultipleSelect,Number,AutoRecognition
  inputType?: InputTypeEnum;
  subArgs?: BindConfigWithSub[];
  // 下拉参数配置
  selectConfig?: {
    // 数据源类型,可用值:MANUAL,PLUGIN
    dataSource: OptionDataSourceEnum;
    // 数据源类型,可用值:Agent,Plugin,Workflow,Knowledge,Table
    targetType: AgentComponentTypeEnum;
    // 插件或工作流ID，dataSource选择PLUGIN时有用
    targetId: number;
    // 下拉选项配置
    config: SelectConfigInfo;
  };
  loopId: number;
  children?: BindConfigWithSub[];
  [key: string]: any;
}

// 自定义disabled类型，继承BindConfigWithSub，添加disabled属性，用于控制组件是否禁用
export interface BindConfigWithSubDisabled extends BindConfigWithSub {
  disabled: boolean;
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
  // 是否开启定时任务,可用值:Open,Close
  openScheduledTask: OpenCloseEnum;
  // 问题建议提示词
  suggestPrompt: string;
  // 首次打开聊天框自动回复消息
  openingChatMsg: string;
  // 首次打开引导问题
  openingGuidQuestions: string[];
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
  agentId: number;
  // 组件类型,可用值:Plugin,Workflow,Trigger,Knowledge,Variable,Database,Model
  type: AgentComponentTypeEnum;
  // 绑定组件配置，不同组件配置不一样
  bindConfig: any;
  // 关联的组件ID
  targetId: number;
  spaceId: number;
  // 组件原始配置
  targetConfig: any;
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
  // 首次打开引导问题
  openingGuidQuestions: string[];
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
