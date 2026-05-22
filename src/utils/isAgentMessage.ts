import { AssistantRoleEnum, MessageTypeEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

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

export function hasAgentMessage(messageList: MessageInfo[]): boolean {
  return messageList?.some(isAgentMessage) ?? false;
}
