import { ResourcePricingConfigInfo } from '@/pages/SpaceResource/types/resource';
import {
  AccessControlEnum,
  MessageScopeEnum,
  SandboxBindTypeEnum,
  SandboxIsolationEnum,
  SandboxTypeEnum,
  UserRoleEnum,
  UserStatusEnum,
} from '@/types/enums/systemManage';
import { PublishStatusEnum } from '../enums/common';
import {
  KnowledgeDataTypeEnum,
  KnowledgePubStatusEnum,
} from '../enums/library';
import {
  ModelApiProtocolEnum,
  ModelCapabilityTypeEnum,
  ModelFunctionCallEnum,
  ModelNetworkTypeEnum,
  ModelScopeEnum,
  ModelStrategyEnum,
  ModelTypeEnum,
  ModelUsageScenarioEnum,
} from '../enums/modelConfig';
import { PluginPublishScopeEnum } from '../enums/plugin';
import { ModelComponentStatusEnum } from '../enums/space';
import { TaskInfo } from './library';

/**
 * 分页参数基础接口
 */
export interface SystemPaginationParams {
  /** 页码 */
  pageNo: number;
  /** 每页条数 */
  pageSize: number;
}

/**
 * 分页返回结果基础接口
 */
export interface SystemPageResult<T> extends SystemPaginationParams {
  /** 总条数 */
  total: number;
  /** 条目列表 */
  records: T[];
}

/**
 * 资源信息基础接口
 */
export interface SystemResourceInfo {
  /** ID */
  id: number;
  /** 智能体ID */
  agentId: number;
  /** 名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 创建人ID */
  creatorId: number;
  /** 创建人 */
  creatorName: string;
  /** 创建时间 */
  created: string;
  /** 空间ID */
  spaceId: number;
  /** 操作 */
  operation: 'agent' | 'page';
  // 是否受后台权限控制，0 不受，1 受 访问控制过滤，0 无需过滤，1 过滤出需要权限管控的内容
  accessControl: AccessControlEnum;
  /** 发布状态 */
  publishStatus: PublishStatusEnum;
  // 发布范围,可用值:Space,Tenant,Global
  publishScope: PluginPublishScopeEnum;
  // 流类型：Workflow / AgentFlow
  workflowType?: string;
  // 网页应用的发布类型,可用值:AGENT,PAGE
  publishType: 'AGENT' | 'PAGE';
  // 网页应用绑定的智能体ID
  pageAgentId: number;
}

// 查询用户列表输入参数
export interface SystemUserListParams extends SystemPaginationParams {
  queryFilter: {
    role?: string;
    userName?: string;
    id?: number;
  };
}

// 新增用户输入参数
export interface AddSystemUserParams {
  phone: string;
  password: string;
  userName: string;
  nickName: string;
  email?: string;
  role: UserRoleEnum;
}

// 更新用户输入参数
export interface UpdateSystemUserParams {
  id: number;
  phone: string;
  userName: string;
  nickName: string;
  email?: string;
  role: UserRoleEnum;
}

// 查询用户列表返回数据
export interface SystemUserListInfo {
  // 主键id
  id: number;
  // 昵称
  nickName: string;
  // 用户名
  userName: string;
  // 手机号码
  phone: string;
  // 邮箱
  email: string;
  // 角色
  role: UserRoleEnum;
  // 状态
  status: UserStatusEnum;
  // 加入时间
  created: string;
}
export interface SystemUserConfig {
  /** 租户ID */
  tenantId: number;
  /** 配置项名称 */
  name: string;
  /** 配置项值 */
  value: string | string[];
  /** 配置项描述 */
  description: string;
  /** 配置项分类，可用值: BaseConfig, ModelSetting, AgentSetting, DomainBind */
  category: 'BaseConfig' | 'ModelSetting' | 'AgentSetting' | 'DomainBind';
  /** 配置项输入类型，可用值: Input, MultiInput, Select, MultiSelect, Textarea, File */
  inputType:
    | 'Input'
    | 'MultiInput'
    | 'Select'
    | 'MultiSelect'
    | 'Textarea'
    | 'File';
  /** 配置项数据类型，可用值: String, Number, Array */
  dataType: 'String' | 'Number' | 'Array';
  /** 配置项提示 */
  notice: string;
  /** 配置项占位符 */
  placeholder: string;
  /** 配置项最小高度 */
  minHeight: number;
  /** 是否必填 */
  required: boolean;
  sort: number;
}

export type ConfigObj = {
  [K in SystemUserConfig['category']]?: SystemUserConfig[];
};

export type TabKey =
  | 'BaseConfig'
  | 'ModelSetting'
  | 'AgentSetting'
  | 'DomainBind';

export type BaseFormItemProps = {
  props: SystemUserConfig;
  currentTab: TabKey;
  modelList: ModelConfigDto[];
  agentList: PublishedDto[];
};

/**
 * 模型配置数据
 */
export interface ModelConfigDto {
  /** 模型ID */
  id: number;
  /** 商户ID */
  tenantId: number;
  /** 空间ID */
  spaceId: number;
  /** 提供商ID */
  pid?: string;
  /** 提供商名称 */
  providerName?: string;
  /** 模型生效范围（可用值: Space, Tenant, Global） */
  scope: ModelScopeEnum;
  /** 模型名称 */
  name: string;
  /** 模型描述 */
  description: string;
  /** 模型标识 */
  model: string;
  /** 模型类型（可用值: Completions, Chat, Edits, Images, Embeddings, Multi, Audio, Video, Other） */
  type: ModelTypeEnum;
  /** 模型能力类型（可用值: Text, Image, Audio, Video, TextEmbedding, MultiEmbedding, Reasoning） */
  types: ModelCapabilityTypeEnum[];
  /** 网络类型（可用值: Internet, Intranet） */
  networkType: ModelNetworkTypeEnum;
  /** 函数调用支持程度（可用值: Unsupported, CallSupported, StreamCallSupported） */
  functionCall: ModelFunctionCallEnum;
  /** 是否是推理模型（0/1） */
  isReasonModel?: number;
  /** token上限 */
  maxTokens: number;
  /** 最大上下文长度 */
  maxContextTokens?: number;
  /** 模型接口协议（可用值: OpenAI, Ollama, Zhipu, Anthropic） */
  apiProtocol: ModelApiProtocolEnum;
  /** API列表 */
  apiInfoList: ApiInfo[];
  /** 接口调用策略（可用值: RoundRobin, WeightedRoundRobin, LeastConnections, WeightedLeastConnections, Random, ResponseTime） */
  strategy: ModelStrategyEnum;
  /** 向量维度 */
  dimension: number;
  /** 修改时间（ISO格式日期字符串） */
  modified: string;
  /** 创建时间（ISO格式日期字符串） */
  created: string;
  /** 创建者信息 */
  creator: CreatorDto;
  /** 管控状态 */
  accessControl?: AccessControlEnum;
  /** 启用状态（1 启用 / 0 禁用） */
  enabled?: ModelComponentStatusEnum;
  /** 可用范围 */
  usageScenarios?: ModelUsageScenarioEnum[];
  /** 定价信息（对象或展示文案） */
  pricing?: ResourcePricingConfigInfo | string;
}

/**
 * API信息
 */
export interface ApiInfo {
  /** 接口地址 */
  url: string;
  /** 接口密钥 */
  key: string;
  /** 权重 */
  weight: number;
}

/**
 * 创建者信息
 */
export interface CreatorDto {
  /** 用户ID */
  userId: number;
  /** 用户名 */
  userName: string;
  /** 昵称 */
  nickName: string;
  /** 头像 */
  avatar: string;
}
/**
 * 发布对象数据
 */
export interface PublishedDto {
  /** 发布ID */
  id: number;
  /** 空间ID */
  spaceId: number;
  /** 目标对象类型，可用值: Agent, Plugin, Workflow, Knowledge */
  targetType: 'Agent' | 'Plugin' | 'Workflow' | 'Knowledge';
  /** 目标对象（智能体、工作流、插件）ID */
  targetId: number;
  /** 发布名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 图标 */
  icon: string;
  /** 备注 */
  remark: string;
  /** 智能体发布修改时间 */
  modified: string;
  /** 智能体发布创建时间 */
  created: string;
  /** 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值) */
  statistics: StatisticsDto;
  /** 发布者信息 */
  publishUser: PublishUserDto;
  /** 分类名称 */
  category: string;
  /** 收藏状态 */
  collect: boolean;
}

/**
 * 统计信息
 */
export interface StatisticsDto {
  /** 目标对象ID */
  targetId: number;
  /** 用户人数 */
  userCount: number;
  /** 会话次数 */
  convCount: number;
  /** 收藏次数 */
  collectCount: number;
  /** 点赞次数 */
  likeCount: number;
  /** 引用次数 */
  referenceCount: number;
  /** 调用总次数 */
  callCount: number;
  /** 失败调用次数 */
  failCallCount: number;
  /** 调用总时长 */
  totalCallDuration: number;
}

/**
 * 发布者信息
 */
export interface PublishUserDto {
  /** 用户ID */
  userId: number;
  /** 用户名 */
  userName: string;
  /** 昵称 */
  nickName: string;
  /** 头像 */
  avatar: string;
}
/**
 * 上传结果数据
 */
export interface UploadResultDto {
  /** 文件完整的网络地址 */
  url: string;
  /** 文件唯一标识 */
  key: string;
  /** 文件名称 */
  fileName: string;
  /** 文件类型 */
  mimeType: string;
  /** 文件大小 */
  size: number;
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
}
/**
 * 租户配置数据
 */
export interface TenantConfigDto {
  /** 站点名称 */
  siteName?: string;
  /** 站点描述 */
  siteDescription?: string;
  /** 站点LOGO（为空使用默认值） */
  siteLogo?: string;
  /** 登录页banner */
  loginBanner?: string;
  /** 登录页banner文案 */
  loginBannerText?: string;
  /** 广场Banner地址（为空使用默认值） */
  squareBanner?: string;
  /** 广场Banner文案标题 */
  squareBannerText?: string;
  /** 广场Banner文案副标题 */
  squareBannerSubText?: string;
  /** 广场Banner链接（为空不跳转） */
  squareBannerLinkUrl?: string;
  /** 开启注册状态（0关闭；1开启） */
  openRegister?: number;
  /** 默认站点Agent ID */
  defaultAgentId?: number;
  /** 首页推荐问题列表 */
  homeRecommendQuestions?: string[];
  /** 站点域名列表 */
  domainNames?: string[];
  /** 主题模板配置（JSON字符串） */
  templateConfig?: string;
}

// 租户订阅基础配置信息，用于订阅基础配置的保存
export interface TenantSubscriptionConfigInfo {
  /*收入分成比例 */
  revenueRatio?: Record<string, unknown>;

  /*支付网关地址 */
  paymentGateway?: string;

  /*是否开启订阅模式 */
  enableSubscription?: number;

  /*积分兑换比例，比如 1000标识1块钱可以兑换1000积分 */
  creditExchangeRate?: number;

  /*积分兑换说明 */
  creditExchangeDesc?: string;

  /*是否开启注册积分赠送 */
  enableGiftCredit?: number;

  /*注册赠送积分数 */
  giftCreditAmount?: number;

  /*注册赠送积分有效期（天） */
  giftCreditExpire?: number;

  /*是否开启每日登录赠送积分 */
  enableDailyGiftCredit?: number;

  /*每日登录赠送积分数 */
  dailyGiftCreditAmount?: number;
}

/**
 * 支付配置查询结果
 */
export interface PayConfigResult {
  /** 支付分成比例 */
  payRate: number;
}

/**
 * 支付网关连通性检测结果
 */
export interface PayConnectivityResult {
  reachable: boolean;
  message: string;
  gatewayBaseUrl: string;
  gatewayServerTimeMillis: number;
  latencyMillis: number;
}

/**
 * 主题配置数据结构
 */
export interface ThemeConfigData {
  /** 主题色 */
  primaryColor: string;
  /** 背景图片ID */
  backgroundId: string;
  /** Ant Design主题（浅色/深色） */
  antdTheme: 'light' | 'dark';
  /** 导航栏风格（浅色/深色） */
  layoutStyle: 'light' | 'dark';
  /** 导航风格ID（style1/style2） */
  navigationStyle: 'style1' | 'style2';
  /** 时间戳 */
  timestamp: number;
}

// 发送通知消息输入参数
export interface NotifyMessageSendParams {
  /** 消息类型 */
  scope: MessageScopeEnum;
  /** 消息内容 */
  content: string;
  /** 消息接收者 */
  userIds: number[];
}

// 工作空间信息
export type SystemSpaceInfo = SystemResourceInfo;

// 查询工作空间列表参数
export interface SystemSpaceListParams extends SystemPaginationParams {
  /** 名称 */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
}

// 空间列表分页响应
export type SystemSpacePage = SystemPageResult<SystemSpaceInfo>;

// 智能体信息
export type SystemAgentInfo = SystemResourceInfo;

// 查询智能体列表参数
export interface SystemAgentListParams extends SystemPaginationParams {
  /** 名称 (模糊搜索) */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
  /** 管控状态 */
  accessControl?: AccessControlEnum;
}

// 智能体列表分页响应
export type SystemAgentPage = SystemPageResult<SystemAgentInfo>;

// 网页应用信息
export type SystemWebappInfo = SystemResourceInfo;

// 查询网页应用列表参数
export interface SystemWebappListParams extends SystemPaginationParams {
  /** 名称 (模糊搜索) */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
  /** 管控状态 */
  accessControl?: AccessControlEnum;
}

// 网页应用列表分页响应
export type SystemWebappPage = SystemPageResult<SystemWebappInfo>;

// 知识库信息
export type SystemKnowledgeInfo = SystemResourceInfo;

// 根据id列表查询知识库详情
export interface KnowledgeInfoById {
  // 主键id
  id: number;
  // 知识库名称
  name: string;
  // 知识库描述
  description: string;
  // 知识状态,可用值:Waiting,Published
  pubStatus: KnowledgePubStatusEnum;
  // 数据类型,默认文本,1:文本;2:表格
  dataType: KnowledgeDataTypeEnum;
  // 知识库的嵌入模型ID
  embeddingModelId: number;
  // 知识库的生成Q&A模型ID
  chatModelId: number;
  spaceId: number;
  // 图标的url地址
  icon: string;
  // 创建时间
  created: string;
  // 创建人id
  creatorId: number;
  // 创建人
  creatorName: string;
  // 	创建人昵称
  creatorNickName: string;
  // 头像
  creatorAvatar: string;
  // 更新时间
  modified: string;
  // 最后修改人id
  modifiedId: number;
  // 最后修改人
  modifiedName: string;
  // 工作流id
  workflowId?: string;
  // 是否受后台权限控制，0 不受，1 受
  accessControl: AccessControlEnum;
}

// 查询知识库列表参数
export interface SystemKnowledgeListParams extends SystemPaginationParams {
  /** 名称 (模糊搜索) */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
  /** 管控状态 */
  accessControl?: AccessControlEnum;
}

// 知识库列表分页响应
export type SystemKnowledgePage = SystemPageResult<SystemKnowledgeInfo>;

// 数据表信息
export type SystemDataTableInfo = SystemResourceInfo;

// 查询数据表列表参数
export interface SystemDataTableListParams extends SystemPaginationParams {
  /** 名称 (模糊搜索) */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
}

// 数据表列表分页响应
export type SystemDataTablePage = SystemPageResult<SystemDataTableInfo>;

// 工作流信息
export type SystemWorkflowInfo = SystemResourceInfo;

// 查询工作流列表参数
export interface SystemWorkflowListParams extends SystemPaginationParams {
  /** 名称 (模糊搜索) */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
}

// 工作流列表分页响应
export type SystemWorkflowPage = SystemPageResult<SystemWorkflowInfo>;

// 定时任务信息
export type SystemTaskInfo = TaskInfo;

// 查询定时任务列表参数
export interface SystemTaskListParams extends SystemPaginationParams {
  /** 任务名称 (模糊搜索) */
  name?: string;
  /** 创建人名称 */
  creatorName?: string;
}

// 定时任务列表分页响应
export type SystemTaskPage = SystemPageResult<SystemTaskInfo>;

// 插件信息
export type SystemPluginInfo = SystemResourceInfo;

// 查询插件列表参数
export interface SystemPluginListParams extends SystemPaginationParams {
  /** 名称 (模糊搜索) */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
}

// 插件列表分页响应
export type SystemPluginPage = SystemPageResult<SystemPluginInfo>;

/**
 * MCP 信息
 */
export type SystemMcpInfo = SystemResourceInfo;

/**
 * 查询 MCP 列表参数
 */
export interface SystemMcpListParams extends SystemPaginationParams {
  /** 名称 (模糊搜索) */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
}

/**
 * MCP 列表分页响应
 */
export type SystemMcpPage = SystemPageResult<SystemMcpInfo>;

/**
 * 技能信息
 */
export type SystemSkillInfo = SystemResourceInfo;

/**
 * 查询技能列表参数
 */
export interface SystemSkillListParams extends SystemPaginationParams {
  /** 名称 (模糊搜索) */
  name?: string;
  /** 创建人ID列表 */
  creatorIds?: number[];
  /** 空间ID */
  spaceId?: number;
  /** 创建人名称 */
  creatorName?: string;
}

/**
 * 技能列表分页响应
 */
export type SystemSkillPage = SystemPageResult<SystemSkillInfo>;
/**
 * 访问统计返回结果
 */
export interface AccessStatsResult {
  /** 今日访问量 */
  todayUserCount: number;
  /** 30日总访问量 */
  last30DaysUserCount: number;
  /** 七日访问趋势 */
  last7DaysTrend: AccessStatsList[];
}

/**
 * 访问统计趋势列表项
 */
export interface AccessStatsList {
  /** 日期 */
  date: string;
  /** 访问量 */
  userCount: number;
}
/**
 * 用户统计返回结果
 */
export interface UserStatsResult {
  /** 总用户数 */
  totalUserCount: number;
  /** 今日新增用户 */
  todayNewUserCount: number;
  /** 七日访问趋势 */
  last7DaysTrend: UserTrendList[];
  /** 三十日访问趋势 */
  last30DaysTrend: UserTrendList[];
  /** 当月访问趋势 */
  monthlyTrend: UserTrendList[];
}

/**
 * 用户趋势列表项
 */
export interface UserTrendList {
  /** 日期 */
  date: string;
  /** 用户数 */
  userCount: number;
}

/**
 * 资源概览统计结果
 */
export interface TotalStatsResult {
  /** 空间数 */
  spaceCount: number;
  /** 智能体数 */
  agentCount: number;
  /** 工作流数 */
  workflowCount: number;
  /** 知识库数 */
  knowledgeCount: number;
  /** 数据表数 */
  tableCount: number;
  /** MCP数 */
  mcpCount: number;
  /** 页面数 */
  pageCount: number;
  /** 模型数 */
  modelCount: number;
  /** 插件数 */
  pluginCount: number;
  /** 技能数 */
  skillCount: number;
}

/**
 * 会话统计返回结果
 */
export interface ConversationStatsResult {
  /** 总会话数 */
  totalConversations: number;
  /** 今日新增会话 */
  todayNewConversations: number;
  /** 七日趋势 */
  last7DaysTrend: ConversationTrendList[];
  /** 三十日趋势 */
  last30DaysTrend: ConversationTrendList[];
  /** 月度趋势 */
  monthlyTrend: ConversationTrendList[];
}

/**
 * 会话趋势项
 */
export interface ConversationTrendList {
  /** 日期 */
  date: string;
  /** 会话数 */
  conversationCount: number;
}

/**
 * 沙盒绑定信息项
 */
export interface SandboxBindItem {
  /** 目标类型 (User/Space) */
  targetType: SandboxBindTypeEnum;
  /** 目标ID */
  targetId: number;
  /** 目标名称 */
  targetName: string;
}

/**
 * 沙盒配置项
 */
export interface SandboxConfigItem {
  id: number;
  scope: 'GLOBAL' | 'USER';
  userId: number;
  name: string;
  configKey: string;
  /** 沙盒类型: Agent (智能体), PageApp (应用开发) */
  type: SandboxTypeEnum;
  /** 绑定信息 */
  bindItems?: SandboxBindItem[];
  /** 沙盒隔离: Tenant (租户), Space (空间), Project (项目) */
  isolation?: SandboxIsolationEnum;
  configValue: {
    hostWithScheme: string;
    agentPort: number;
    vncPort: number;
    fileServerPort: number;
    apiKey: string;
    maxUsers: number;
  };
  description: string;
  agentId?: number;
  isActive: boolean;
  online: boolean;
  created: string;
  modified: string;
  usingCount?: number;
  maxAgentCount?: number;
}

/**
 * 沙盒全局配置
 */
export interface SandboxGlobalConfig {
  perUserMemoryGB: number | string;
  perUserCpuCores: number | string;
}

/**
 * 沙盒选择项（用于电脑选择器下拉）
 */
export interface SandboxSelectDto {
  /** 沙盒ID */
  sandboxId: string;
  /** 沙盒名称 */
  name: string;
  /** 沙盒描述 */
  description: string;
}

/**
 * 用户可选沙盒列表响应
 */
export interface UserSandBoxSelectDto {
  /** 可选的沙盒列表 */
  sandboxes: SandboxSelectDto[];
  /** 已选择的沙盒，key为agentId，value为sandboxId */
  agentSelected: Record<string, string>;
}
/**
 * 查询收益明细参数
 */
export interface SystemRevenueDetailParams {
  /** 用户ID */
  userId: number;
  /** 日期 (YYYYMMDD) */
  dt?: number;
  /** 页码 */
  pageNum: number;
  /** 每页条数 */
  pageSize: number;
}

/**
 * 收益明细信息
 */
export interface SystemRevenueDetailInfo {
  /** 明细ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 日期 */
  dt: string;
  /** 金额 */
  amount: number;
  /** 类型 (PLAN, MODEL_CALL, TOOL_CALL 等) */
  type: string;
  /** 类型关联ID */
  typeId: number;
  /** 关联订单ID */
  orderId: number;
  /** 目标类型 (AGENT, SKILL, MODEL, PLUGIN, MCP, WORKFLOW) */
  targetType: string;
  /** 目标ID */
  targetId: number;
  /** 业务单号 */
  bizNo: string;
  /** 备注/收益项名称 */
  remark: string;
  /** 扩展字段 */
  extra: Record<string, any>;
  /** 创建时间 */
  created: string;
}

/** 资源统计-统计分组 */
export interface StatGroup {
  /** 输入 Token（不含缓存）；总输入 = totalInputTokens + totalCacheInputTokens */
  totalInputTokens: number;
  /** 可选冗余字段，展示以 totalInputTokens 为准 */
  inputTokens?: number;
  /** 总输出Token */
  totalOutputTokens: number;
  /** 总缓存输入Token */
  totalCacheInputTokens: number;
  /** 工具总个数 */
  toolCount: number;
  /** 工具调用总次数 */
  toolCallCount: number;
  /** 智能体个数 */
  agentCount: number;
  /** 智能体调用总次数 */
  agentCallCount: number;
  /** 模型调用总次数 */
  modelCallCount: number;
  /** 模型调用失败次数 */
  failedModelCallCount: number;
  /** 工具调用失败次数 */
  failedToolCallCount: number;
  /** 智能体调用失败次数 */
  failedAgentCallCount: number;
  /** 总积分 */
  totalCreditAmount: number;
  /** 总金额 */
  totalAmount: number;
}

/** 资源统计汇总 */
export interface ResourceStatSummaryDTO {
  /** 消费统计 */
  consumption: StatGroup;
  /** 销售统计 */
  sales: StatGroup;
}

/** 资源统计明细查询参数 */
export interface ResourceStatDetailParams {
  userId?: number;
  type?: 'CONSUMPTION' | 'SALES';
  targetType?: string;
  targetId?: number;
  dtStart?: string;
  dtEnd?: string;
  pageNum?: number;
  pageSize?: number;
}

/** 资源统计明细记录 */
export interface ResourceStatDTO {
  id: number;
  tenantId: number;
  userId: number;
  userName: string;
  nickName: string;
  phone: string;
  email: string;
  type: string;
  targetType: string;
  targetId: number;
  targetName: string;
  dt: string;
  callCount: number;
  callFailedCount: number;
  creditAmount: number;
  feeAmount: number;
  /** 缓存输入 Token */
  cacheInputTokens: number;
  /** 输入 Token（明细字段语义因业务接口而异，见各页 resourceStatTokenMetrics） */
  inputTokens: number;
  outputTokens: number;
  extra: string;
  created: string;
}

/* ──────────────────────────────────────────────
 * 连接器提供方 (Connector Provider)
 * 字段对齐 /api/system/connector/providers 真实 schema
 * ────────────────────────────────────────────── */

/** 鉴权方式枚举（''=全部 用于筛选项） */
export type ConnectorAuthType =
  | ''
  | 'no_auth'
  | 'api_key'
  | 'bearer'
  | 'oauth2'
  | 'custom';

/** 连接器提供方信息（响应数组元素） */
export interface ConnectorProviderInfo {
  /** 主键（也是拖拽排序主键） */
  id: number;
  /** 所属空间 ID */
  spaceId?: number;
  /** 服务标识（如图中 aliyun_oss、aws_s3） */
  service: string;
  /** 显示名（如 Alibaba Cloud OSS） */
  displayName: string;
  /** 描述 */
  description?: string;
  /** 图标 URL */
  icon?: string;
  /** 主分类 */
  category?: string;
  /** 标签（如 ["Storage", "Developer Tools"]） */
  tags?: string[];
  /** 鉴权方式 */
  authType: ConnectorAuthType;
  /** baseUrl */
  baseUrl?: string;
  /** 鉴权配置对象 */
  authConfig?: Record<string, unknown>;
  /** OAuth 应用模式 */
  oauthAppMode?: string;
  /** 来源 */
  source?: string;
  /** 提供方版本 */
  providerVersion?: string;
  /** 管理方 */
  managedBy?: string;
  /** 是否启用代理 */
  proxyEnabled?: boolean;
  /** 启用状态：小写英文 enabled/disabled */
  status?: 'enabled' | 'disabled' | string;
  /** 排序值（拖拽保存时按 index+1 计算） */
  sortOrder?: number;
  /** 是否已连接 */
  connected?: boolean;
  /** 工具/动作数量（对应"工具数"列） */
  actionCount?: number;
  /** 更新时间 */
  modified?: string;
  /** 创建时间 */
  created?: string;
}

/** 获取提供方列表参数（前端筛选参数，暂未透传） */
export interface ConnectorProviderListParams {
  /** 按鉴权方式过滤；空串=全部 */
  authType?: ConnectorAuthType;
  /** 按状态过滤；空串=全部 */
  status?: 'enabled' | 'disabled' | '';
}

/**
 * saveOfficialOrder 入参：
 * 直接传 service 数组，数组索引即排序（越小越靠前）
 */
export interface SaveConnectorOrderParams {
  services: string[];
}

/**
 * 启用/停用某个连接器提供方（状态：PUT /api/system/connector/providers/{service}）
 * service 拼到 URL path 上，enabled 作为 query 参数
 */
export interface ToggleConnectorProviderStatusParams {
  /** 连接器 service 标识（如 aliyun_oss、aws_s3） */
  service: string;
  /** true=启用，false=停用 */
  enabled: boolean;
}

/**
 * 启用/停用某个连接器下的工具/动作（PUT /api/system/connector/actions/{id}/status）
 * id 拼到 URL path 上，enabled 作为 query 参数（Boolean）
 */
export interface ToggleConnectorActionStatusParams {
  /** 工具/动作主键 ID（对应 ConnectorProviderAction.id） */
  id: string | number;
  /** true=启用，false=停用 */
  enabled: boolean;
}

/**
 * 删除某个连接器下的工具/动作（DELETE /api/system/connector/actions/{id}）
 * id 拼到 URL path 上，无 body
 */
export interface DeleteConnectorActionParams {
  /** 工具/动作主键 ID（对应 ConnectorProviderAction.id） */
  id: string | number;
}

/**
 * 导出连接器提供方（POST /api/system/connector/providers/export）
 * - 不传 services：导出全部
 * - 传 services 数组：导出所选/单行
 */
export interface ExportConnectorProvidersParams {
  /** 指定要导出的 service 列表；不传或空数组 = 导出全部 */
  services?: string[];
}

/**
 * 连接器导入 diff 条目（POST /api/connector/import 响应 data.items 元素）
 * - type：provider = 连接器 / action = 工具
 * - op：add = 新增 / update = 更新 / unchanged = 不变 / skip = 跳过（受保护）等
 * - reason：skip 时的跳过原因，其余为 null
 */
export interface ConnectorImportDiffItem {
  type?: string;
  service?: string;
  actionKey?: string | null;
  op?: string;
  reason?: string | null;
}

/**
 * 连接器导入 diff 预览结果（POST /api/connector/import 响应 data）
 * - importId：本次导入会话标识，确认导入时引用（内容变更后需重新预览）
 * - addCount / updateCount / unchangedCount / skipProtectedCount：四类变更计数
 */
export interface ConnectorImportDiff {
  importId: string;
  source?: string;
  providerVersion?: string;
  addCount?: number;
  updateCount?: number;
  unchangedCount?: number;
  skipProtectedCount?: number;
  items?: ConnectorImportDiffItem[] | null;
}

/**
 * 确认连接器导入入参（POST /api/connector/import/apply）
 * - importId 即预览导入 diff（POST /api/connector/import）响应中的导入会话标识
 */
export interface ApplyConnectorImportParams {
  importId: string;
}

/**
 * 连接器调试：分页获取提供方列表入参（GET /api/connector/providers）
 * 与系统连接器列表（GET /api/system/connector/providers，非分页返回数组）是两个接口
 */
export interface ConnectorProviderPageParams {
  /** 空间 ID（默认 52） */
  spaceId?: number | string;
  /** 页码（调试弹窗一次拉全量，固定传 1） */
  pageNum?: number;
  /** 页大小（调试弹窗一次拉全量，固定传 2000） */
  pageSize?: number;
  /** 数据范围：space = 空间维度（空间连接器页） */
  scope?: string;
  /** 启用状态筛选：all / enabled / disabled */
  status?: string;
  /** 连接状态筛选：all / true / false */
  connected?: string;
  /** 关键字（名称 / service / 分类 / 标签） */
  keyword?: string;
}

/**
 * 连接器调试：分页获取提供方列表响应 data
 * 真实响应为分页结构，列表数据在 data.records 下
 */
export interface ConnectorProviderPageResult {
  /** 当前页数据 */
  records?: ConnectorProviderInfo[] | null;
  /** 总条数 */
  total?: number;
  /** 当前页码 */
  pageNum?: number;
  /** 页大小 */
  pageSize?: number;
}

/**
 * 连接器工具调试执行入参（POST /api/connector/runtime/execute）
 * - providerService：连接器 service（连接器下拉选中值）
 * - actionKey：工具 actionKey（动作下拉选中值）
 * - args：输入参数对象（输入参数 JSON 文本域解析结果，空值占位原样提交）
 */
export interface ConnectorRuntimeExecuteParams {
  /** 连接器 service（如 ably） */
  providerService: string;
  /** 工具唯一标识（如 delete_channel_subscription） */
  actionKey: string;
  /** 输入参数对象 */
  args?: Record<string, unknown>;
}

/**
 * 连接器工具调试执行结果（POST /api/connector/runtime/execute 响应 data）
 * 调试弹窗将整个 data 原样 pretty JSON 展示在「执行结果」区
 */
export interface ConnectorRuntimeExecuteResult {
  /** 是否执行成功 */
  success?: boolean;
  /** 人类可读提示（失败原因，如「请先建立连接: ably」） */
  message?: string;
  /** 业务数据（成功时的返回值；失败时可能为 null） */
  data?: unknown;
  /** 机器可读错误码（如 connection_required） */
  errorCode?: string;
  /** 元信息：executionId 用于日志追溯；authorizeHint 为修复指引 */
  meta?: Record<string, unknown>;
}

/**
 * 新增连接器提供方入参（POST /api/system/connector/providers）
 * - 免鉴权参考：{ ..., authType: "no_auth", authConfig: {} }
 * - OAuth 2.0 参考不传 authConfig，改为顶层 oauthAppMode（byo / platform）；
 *   platform 的 App 配置在创建成功后另调 POST /api/system/connector/oauth-config
 */
export interface CreateConnectorProviderParams {
  /** 服务唯一标识（小写字母开头的小写字母/数字/下划线，创建后不可改） */
  service: string;
  /** 显示名称 */
  displayName: string;
  /** 描述 */
  description?: string;
  /** 鉴权方式（'' 仅用于筛选，不入参） */
  authType: Exclude<ConnectorAuthType, ''>;
  /** 请求基础地址 */
  baseUrl?: string;
  /** 主分类 */
  category?: string;
  /** 标签 */
  tags?: string[];
  /** 鉴权配置（no_auth / bearer 传空对象，api_key / custom 按表单组装；oauth2 不传） */
  authConfig?: Record<string, unknown>;
  /** OAuth App 模式（仅 authType = oauth2 时传）：byo / platform */
  oauthAppMode?: 'byo' | 'platform';
}

/**
 * 保存 OAuth App 配置入参（POST /api/system/connector/oauth-config）
 * 创建 oauth2 + platform 模式的连接器成功后追加调用，配置平台公共 App
 */
export interface SaveConnectorOauthConfigParams {
  /** 连接器 service 标识（须已创建） */
  service: string;
  /** 在 IdP 注册的 Client ID */
  clientId: string;
  /** Client Secret（加密落库） */
  clientSecret: string;
  /** 授权端点 */
  authUrl: string;
  /** 令牌端点 */
  tokenUrl: string;
  /** 授权 scopes */
  scopes?: string[];
}

/**
 * 连接器下的工具/动作定义
 * 对应 GET /api/connector/providers/{service} 响应里的 actions/tools 列表元素
 */
export interface ConnectorProviderAction {
  /**
   * 工具主键 ID
   * 切换状态接口 PUT /api/system/connector/actions/{id}/status 要用
   */
  id?: string | number;
  /** 工具唯一标识 */
  name: string;
  /** 显示名（与 name 重复时取 name） */
  displayName?: string;
  /** 标签 */
  tags?: string[];
  /** 工具描述 */
  description?: string;
  /** 调用协议（如 HTTP / FUNCTION） */
  protocol?: string;
  /**
   * 工具状态（'enabled' / 'disabled'）
   * - enabled：抽屉里不展示状态 tag，操作按钮显示"停用"
   * - 其他（如 disabled）：展示"已停用"状态 tag，操作按钮显示"启用"
   */
  status?: 'enabled' | 'disabled' | string;
  /**
   * 工具在后端的唯一键（用于在头部右侧展示）
   * 例如 batch_presence / create_channel 等
   */
  actionKey?: string;
  /** 输入参数（递归嵌套；后端可能返回 null）——「编辑工具」弹窗回填用 */
  inputArgs?: ConnectorActionInputArg[] | null;
  /** 执行类型枚举：DECLARATIVE（HTTP 接口）/ PLUGIN（绑定插件）/ WORKFLOW（绑定工作流） */
  execType?: 'DECLARATIVE' | 'PLUGIN' | 'WORKFLOW' | string;
  /** 执行引用：绑定的插件/工作流 id（字符串；DECLARATIVE 时为 null） */
  execRef?: string | null;
  /**
   * 执行声明：DECLARATIVE 为 HTTP 请求声明（ConnectorActionHttpSpec），
   * PLUGIN / WORKFLOW 为绑定声明快照（ConnectorActionBindSpec）；可能为 null
   */
  httpSpec?: ConnectorActionHttpSpec | ConnectorActionBindSpec | null;
}

/**
 * 输入参数节点（递归嵌套），请求体 inputArgs 数组元素
 *
 * - dataType 取值：String / Integer / Number / Boolean / Object /
 *   Array_File / Array_String / Array_Integer / Array_Number / Array_Boolean / Array_Object
 * - require：勾选"必填"时才传（require: true），未勾选不传该字段
 * - subArgs：dataType = Object / Array_Object 时的下级参数（每个又是完整节点，可任意层级嵌套；
 *   Array_Object 的下级参数描述数组元素 object 的字段结构）
 *
 * 嵌套请求示例：
 *   {
 *     "name": "gdsf", "dataType": "Array_Object",
 *     "subArgs": [
 *       {
 *         "name": "gdsf", "dataType": "Object",
 *         "subArgs": [{ "name": "gsdf", "description": "...", "dataType": "String" }]
 *       }
 *     ]
 *   }
 */
export interface ConnectorActionInputArg {
  /** 参数名 */
  name: string;
  /** 参数说明：没填就不传该字段 */
  description?: string;
  /** 参数类型 */
  dataType: string;
  /** 必填：创建提交仅勾选时传 true（未勾选不传该字段）；读取时后端可能返回 false */
  require?: boolean;
  /** dataType = Object / Array_Object 时的下级参数（递归嵌套） */
  subArgs?: ConnectorActionInputArg[];
}

/**
 * BODY 字段节点（类型化，递归嵌套），httpSpec.bodyFields 数组元素
 *
 * 嵌套请求示例：
 *   {
 *     "name": "sdfdf", "type": "object",
 *     "children": [
 *       {
 *         "name": "gf", "type": "array", "mapping": "dfgerg",
 *         "item": {
 *           "type": "object",
 *           "children": [
 *             { "name": "fwegef", "type": "string", "mapping": "sfdsf" },
 *             { "name": "gsdf", "type": "array", "mapping": "gdfg", "item": { "type": "number" } }
 *           ]
 *         }
 *       }
 *     ]
 *   }
 */
export interface ConnectorActionBodyField {
  /** 字段名 */
  name: string;
  /** 字段类型：string / number / boolean / object / array */
  type: string;
  /** 映射值：输入参数名 / opt:参数名。object 的值由子字段组成，无该键；其余类型没填就不传 */
  mapping?: string;
  /** type = object 时的子字段（每个又是完整字段节点，可任意层级嵌套） */
  children?: ConnectorActionBodyField[];
  /** type = array 时的元素声明（仅声明结构，无 name / mapping） */
  item?: ConnectorActionBodyItem;
}

/**
 * array 字段的元素声明节点（bodyFields[].item，可递归嵌套）
 * - 元素类型 = object：children 为元素的子字段（完整字段节点）
 * - 元素类型 = array：item 指向下一层元素声明（多维数组逐层声明）
 */
export interface ConnectorActionBodyItem {
  /** 元素类型：string / number / boolean / object / array */
  type: string;
  /** 元素类型 = object 时的元素子字段 */
  children?: ConnectorActionBodyField[];
  /** 元素类型 = array 时的下一层元素声明 */
  item?: ConnectorActionBodyItem;
}

/** 可绑定插件/工作流查询参数：GET /api/connector/bindable?type=plugin|workflow&spaceId=xxx */
export interface ConnectorBindableParams {
  /** 绑定类型：plugin = 绑定插件，workflow = 绑定工作流 */
  type: 'plugin' | 'workflow';
  /** 空间 ID（筛选该空间下可绑定的插件/工作流） */
  spaceId?: number | string;
}

/** bindable 返回的参数节点（inputArgs / outputArgs 数组元素，可递归嵌套） */
export interface ConnectorBindableArg {
  key?: string;
  name?: string;
  displayName?: string | null;
  description?: string | null;
  /** 参数类型：String / Integer / Number / Boolean / Object / Array_* */
  dataType?: string;
  /** 是否必填 */
  require?: boolean;
  /** 下级参数（嵌套结构；后端可能返回 null） */
  subArgs?: ConnectorBindableArg[] | null;
  children?: ConnectorBindableArg[] | null;
}

/**
 * 可绑定插件/工作流项（GET /api/connector/bindable 返回）
 * id + name 用作「新增工具」弹窗绑定下拉的选项（value = id，提交为 execRef）；
 * 选中后 inputArgs 递归回填输入参数声明（只读展示），为空则展示「暂无」
 */
export interface ConnectorBindableItem {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  inputArgs?: ConnectorBindableArg[] | null;
  outputArgs?: ConnectorBindableArg[] | null;
}

/**
 * HTTP 请求声明（execType = DECLARATIVE 时填写）
 * 请求示例：
 *   {
 *     "method": "POST",
 *     "path": "/repos/{owner}/{repo}/issues",
 *     "pathParams": { "owner": "input.owner" },
 *     "query": {},
 *     "bodyFields": [{ "name": "...", "type": "string", "mapping": "..." }],（嵌套时含 children / item，见 ConnectorActionBodyField）
 *     "response": { "extract": "$" }
 *   }
 * 值来源写法：输入参数名（如 input.owner）· opt:参数名（可选，缺失则整个字段省略）· literal:固定值
 */
export interface ConnectorActionHttpSpec {
  /** 请求方法（GET / POST / PUT / PATCH / DELETE） */
  method: string;
  /** 请求路径模板，支持 {名称} 占位符 */
  path: string;
  /** 路径占位符映射：{ 占位符名: 值来源 }，如 { owner: 'input.owner' } */
  pathParams?: Record<string, string>;
  /** QUERY 参数映射：{ 参数名: 值来源 } */
  query?: Record<string, string>;
  /** HEADER 映射：{ 头字段名: 值来源 } */
  headers?: Record<string, string>;
  /** BODY 字段（类型化·支持嵌套）数组：[{ name, type, mapping?, children?, item? }]；与 bodyRaw 二选一 */
  bodyFields?: ConnectorActionBodyField[];
  /** 原样请求体：填输入参数名，其值原样作为请求体发送 */
  bodyRaw?: string;
  /** 超时毫秒（缺省不传） */
  timeoutMs?: number;
  /** 响应提取：JSONPath；未填时不传该键（后端默认取响应整体） */
  response?: { extract?: string };
}

/**
 * 绑定声明（execType = PLUGIN / WORKFLOW 时 httpSpec 携带的绑定信息快照）
 *
 * 请求示例：
 *   { "bindType": "PLUGIN", "bindId": "614", "name": "token价格查询_1",
 *     "icon": null, "description": "token价格查询", "spaceId": 57 }
 */
export interface ConnectorActionBindSpec {
  /** 绑定类型：PLUGIN（绑定插件）/ WORKFLOW（绑定工作流） */
  bindType: 'PLUGIN' | 'WORKFLOW';
  /** 绑定的插件/工作流 id（字符串化） */
  bindId: string;
  /** 插件/工作流名称 */
  name: string;
  /** 图标（接口可能返回 null / 空串，原样透传；缺省补 null） */
  icon?: string | null;
  /** 描述 */
  description?: string;
  /** 绑定时筛选的空间 ID */
  spaceId: number | string;
}

/**
 * 新增连接器工具/动作请求体
 * 对应接口：POST /api/system/connector/providers/{service}/actions
 * service 拼到 URL path 上
 *
 * 空值省略规则（后端契约）：
 * - inputArgs / outputArgs：没有添加参数时不传该字段
 * - execRef：仅 execType = PLUGIN / WORKFLOW（绑定插件/工作流）时才传
 *   （值为选中插件/工作流的 id 字符串）
 * - httpSpec：两种形态按 execType 二选一 ——
 *   DECLARATIVE 传 HTTP 请求声明（其内部映射键 pathParams / query /
 *   headers / bodyFields 没有内容时不传）；PLUGIN / WORKFLOW 传绑定
 *   声明快照（bindType / bindId / name / icon / description / spaceId）
 */
export interface CreateConnectorActionParams {
  /** 工具唯一标识（创建后不可改） */
  actionKey: string;
  /** 工具名称 */
  name: string;
  /** 工具说明（供 Agent 判断何时调用） */
  description?: string;
  /** 标签 */
  tags?: string[];
  /** 输入参数数组：[{ name, description, dataType, require? }]；没有添加参数时不传该字段 */
  inputArgs?: ConnectorActionInputArg[];
  /** 输出参数（当前表单不采集，不传该字段） */
  outputArgs?: Record<string, unknown>;
  /** 执行类型枚举：DECLARATIVE（HTTP 接口）/ PLUGIN（绑定插件）/ WORKFLOW（绑定工作流） */
  execType: 'DECLARATIVE' | 'PLUGIN' | 'WORKFLOW';
  /** 执行引用（仅绑定插件 / 绑定工作流时才传该字段） */
  execRef?: string;
  /** HTTP 请求声明（DECLARATIVE）或绑定声明快照（PLUGIN / WORKFLOW），按执行类型二选一 */
  httpSpec?: ConnectorActionHttpSpec | ConnectorActionBindSpec;
}

/**
 * 获取连接器提供方详情响应
 * 对应接口：GET /api/connector/providers/{service}?spaceId=xxx
 *
 * 注：service 在 URL path 上；spaceId 是 query 参数。
 * 真实响应为嵌套结构：提供方信息在 data.provider 下，工具列表在 data.actions。
 */
export interface ConnectorProviderDetail {
  /** 提供方基础信息（嵌套在 provider 下，字段同列表行 ConnectorProviderInfo） */
  provider?: ConnectorProviderInfo;
  /** 该提供方下的工具列表（与 provider 平级，位于 data 顶层） */
  actions?: ConnectorProviderAction[];
}
