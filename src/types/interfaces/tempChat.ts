import React from 'react';
import { AgentSelectedComponentInfo } from './agent';
import { AttachmentFile } from './conversationInfo';

/**
 * 返回的具体业务数据
 */
export interface AgentTempChatDto {
  key?: React.Key;
  // 智能体ID
  agentId: number;
  // 链接地址
  chatUrl: string;
  // 二维码地址
  qrCodeUrl: string;
  // 链接过期时间
  expire?: string;
  // 链接ID
  id: number;
  // 是否需要登录
  requireLogin?: number;
  userId?: number;
}

/**
 * 查询临时会话详细输入参数
 */
export interface TempConversationQueryDto {
  // 链接Key
  chatKey: string;
  // 会话唯一标识
  conversationUid?: string;
}

/**
 * 创建临时会话输入参数
 */
export interface TempConversationCreateDto {
  // 链接Key
  chatKey: string;
  // 校验Token，暂时不传，后续真人校验时传递
  checkToken?: string;
}

/**
 * TempChatMessage
 */
export interface TempChatCompletionsParams {
  // 附件列表
  attachments?: AttachmentFile[];
  // 链接Key
  chatKey: string;
  // 会话唯一标识
  conversationUid: number;
  // chat消息
  message?: string;
  selectedComponents?: AgentSelectedComponentInfo[];
  // 变量参数，前端需要根据agent配置组装参数
  variableParams?: {
    [key: string]: any;
  };
}
