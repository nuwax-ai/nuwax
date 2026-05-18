import { AssistantRoleEnum, MessageTypeEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

/**
 * 判断是否为 Agent/助手侧消息（兼容 role、senderType、messageType 多种后端字段）
 */
export function isAgentMessage(message: MessageInfo): boolean {
  const role = String(message.role || '').toUpperCase();
  const senderType = String(message.senderType || '').toUpperCase();
  const messageType = String(message.messageType || '').toUpperCase();

  return (
    role === AssistantRoleEnum.ASSISTANT ||
    senderType === AssistantRoleEnum.ASSISTANT ||
    senderType === 'AGENT' ||
    messageType === MessageTypeEnum.ASSISTANT
  );
}

/**
 * 消息列表中是否包含至少一条 Agent 消息
 */
export function hasAgentMessage(messageList: MessageInfo[]): boolean {
  return messageList?.some(isAgentMessage) ?? false;
}
