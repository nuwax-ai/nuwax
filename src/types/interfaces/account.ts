/**
 * 用户 API KEY 信息
 */
export interface ApiKeyInfo {
  id: number;
  tenantId: number;
  userId: number;
  /** 名称 */
  name: string;
  targetType: string;
  targetId: string;
  /** API Key */
  accessKey: string;
  config: {
    isDevMode: number;
    enabled: boolean;
    modelId: number;
    modelBaseUrl: string;
    modelApiKey: string;
    conversationId: string;
    modelName: string;
    protocol: string;
    scope: string;
    userName: string;
    requestId: string;
    apiConfigs: {
      key: string;
      rpm: number;
    }[];
  };
  /** 状态 0 停用; 1 启用 */
  status: number;
  /** 过期时间 */
  expire: string;
  creator: {
    userId: number;
    userName: string;
  };
  /** 创建时间 */
  created: string;
}

/**
 * 创建 API KEY 参数
 */
export interface ApiKeyCreateParams {
  /** 名称 */
  name: string;
  /** 过期时间（时间戳，当天 23:59:59） */
  expire?: number | null;
}

/**
 * 更新 API KEY 参数
 */
export interface ApiKeyUpdateParams {
  /** API Key */
  accessKey: string;
  /** 状态 0 停用; 1 启用 */
  status: number;
  /** 名称 */
  name: string;
  /** 过期时间（时间戳，当天 23:59:59） */
  expire?: number | null;
  /** API 权限配置 */
  apiConfigs?: {
    key: string;
    rpm: number;
  }[];
}

/**
 * API KEY 统计数值项
 */
export interface ApiKeyStatsCount {
  /** 总次数 */
  totalCount: number;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failCount: number;
}

/**
 * API KEY 接口调用统计信息
 */
export interface ApiKeyStatsInfo {
  /** 密钥名称 */
  name: string;
  /** 接口地址 */
  path: string;
  /** 密钥内容 */
  key: string;
  /** 总计 */
  total: ApiKeyStatsCount;
  /** 今日 */
  today: ApiKeyStatsCount;
  /** 昨天 */
  yesterday: ApiKeyStatsCount;
  /** 本周 */
  week: ApiKeyStatsCount;
  /** 本月 */
  month: ApiKeyStatsCount;
}

/**
 * API 权限项定义
 */
export interface OpenApiDefinition {
  /** 权限名称 */
  name: string;
  /** 权限key */
  key: string;
  /** 权限角色 */
  role: string;
  /** 权限路径 */
  path: string;
  /** 子权限列表 */
  apiList?: OpenApiDefinition[];
}
