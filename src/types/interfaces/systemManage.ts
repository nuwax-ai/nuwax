import {
  MessageScopeEnum,
  UserRoleEnum,
  UserStatusEnum,
} from '@/types/enums/systemManage';

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
  operation: string;
}

// 查询用户列表输入参数
export interface SystemUserListParams extends SystemPaginationParams {
  queryFilter: {
    role?: string;
    userName?: string;
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
  /** 模型生效范围（可用值: Space, Tenant, Global） */
  scope: 'Space' | 'Tenant' | 'Global';
  /** 模型名称 */
  name: string;
  /** 模型描述 */
  description: string;
  /** 模型标识 */
  model: string;
  /** 模型类型（可用值: Completions, Chat, Edits, Images, Embeddings, Audio, Other） */
  type:
    | 'Completions'
    | 'Chat'
    | 'Edits'
    | 'Images'
    | 'Embeddings'
    | 'Audio'
    | 'Other';
  /** 网络类型（可用值: Internet, Intranet） */
  networkType: 'Internet' | 'Intranet';
  /** 函数调用支持程度（可用值: Unsupported, CallSupported, StreamCallSupported） */
  functionCall: 'Unsupported' | 'CallSupported' | 'StreamCallSupported';
  /** token上限 */
  maxTokens: number;
  /** 模型接口协议（可用值: OpenAI, Ollama, Zhipu, Anthropic） */
  apiProtocol: 'OpenAI' | 'Ollama' | 'Zhipu' | 'Anthropic';
  /** API列表 */
  apiInfoList: ApiInfo[];
  /** 接口调用策略（可用值: RoundRobin, WeightedRoundRobin, LeastConnections, WeightedLeastConnections, Random, ResponseTime） */
  strategy:
    | 'RoundRobin'
    | 'WeightedRoundRobin'
    | 'LeastConnections'
    | 'WeightedLeastConnections'
    | 'Random'
    | 'ResponseTime';
  /** 向量维度 */
  dimension: number;
  /** 修改时间（ISO格式日期字符串） */
  modified: string;
  /** 创建时间（ISO格式日期字符串） */
  created: string;
  /** 创建者信息 */
  creator: CreatorDto;
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
}

// 网页应用列表分页响应
export type SystemWebappPage = SystemPageResult<SystemWebappInfo>;

// 知识库信息
export type SystemKnowledgeInfo = SystemResourceInfo;

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
