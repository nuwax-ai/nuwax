import { AgentComponentTypeEnum } from '@/types/enums/agent';

/**
 * IM 机器人类型
 */
export enum IMRobotTypeEnum {
  /** 企业微信机器人 */
  WeChatBot = 'WeChatBot',
  /** 企业微信应用 */
  WeChatApp = 'WeChatApp',
}

/**
 * IM 机器人状态
 */
export enum IMRobotStatusEnum {
  /** 启用 */
  Enabled = 1,
  /** 停用 */
  Disabled = 0,
}

/**
 * IM 机器人信息
 */
export interface IMRobotInfo {
  id: number;
  spaceId: number;
  name: string;
  type: IMRobotTypeEnum;
  status: IMRobotStatusEnum;
  /** 绑定目标类型（目前仅支持 Agent） */
  targetType: AgentComponentTypeEnum.Agent;
  /** 绑定目标 ID */
  targetId: number;
  /** 绑定目标名称 */
  targetName?: string;
  /** 绑定目标图标 */
  targetIcon?: string;
  /** 机器人配置（Webhook URL 等） */
  config: {
    webhookUrl?: string;
    agentId?: string;
    secret?: string;
  };
  created: string;
  modified: string;
}

/**
 * 添加 IM 机器人参数
 */
export interface AddIMRobotParams {
  spaceId: number;
  name: string;
  type: IMRobotTypeEnum;
  status: IMRobotStatusEnum;
  targetType: AgentComponentTypeEnum.Agent;
  targetId: number;
  config: {
    webhookUrl?: string;
    agentId?: string;
    secret?: string;
  };
}

/**
 * 更新 IM 机器人参数
 */
export interface UpdateIMRobotParams extends Partial<AddIMRobotParams> {
  id: number;
}
