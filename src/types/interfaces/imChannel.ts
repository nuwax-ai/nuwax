/**
 * IM 机器人类型
 */
export enum IMChannelTypeEnum {
  /** 机器人 */
  Bot = 'bot',
  /** 应用 */
  App = 'app',
}

/**
 * IM 机器人状态
 */
export enum IMChannelStatusEnum {
  /** 启用 */
  Enabled = 1,
  /** 停用 */
  Disabled = 0,
}

/**
 * IM 机器人信息
 */
export interface IMChannelInfo {
  id: number;
  channel: string;
  targetType: string;
  targetId: number | string;
  agentId: number;
  agentName: string;
  enabled: boolean;
  configData: string;
  name: string;
  created: string;
  creatorId: number;
  creatorName: string;
  modified: string;
  modifiedId: number;
  modifiedName: string;
  agentIcon?: string;
  agentDescription?: string;
  outputMode?: string;
}

/**
 * 飞书机器人配置
 */
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  verificationToken: string;
  encryptKey: string;
}

/**
 * 钉钉机器人配置
 */
export interface DingtalkConfig {
  clientId: string;
  clientSecret: string;
  robotCode: string;
}

/**
 * 企业微信机器人配置
 */
export interface WeworkBotConfig {
  aibotId: string;
  corpId: string;
  token: string;
  encodingAesKey: string;
}

/**
 * 企业微信应用配置
 */
export interface WeworkAppConfig {
  agentId: string;
  corpId: string;
  corpSecret: string;
  token: string;
  encodingAesKey: string;
}

/**
 * 添加 IM 渠道配置参数
 */
export interface AddIMChannelParams {
  id?: number;
  channel: string; // feishu/dingtalk/wework
  targetType: string;
  agentId: number;
  enabled: boolean;
  configData: string; // JSON 字符串
  spaceId?: number;
  outputMode?: string;
}
