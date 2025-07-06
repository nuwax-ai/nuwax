import {
  MessageScopeEnum,
  UserRoleEnum,
  UserStatusEnum,
} from '@/types/enums/systemManage';

// 查询用户列表输入参数
export interface SystemUserListParams {
  pageNo: number;
  pageSize: number;
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
