import type {
  ConversationInfo,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import type {
  ChatConversation,
  ChatMessage,
  ChatMessagePart,
  ChatMessageRole,
  ChatMessageStatus,
} from '@nuwax-ai/chat-kit/core';

const asId = (value: unknown, fallback: string): string =>
  value === undefined || value === null || value === ''
    ? fallback
    : String(value);

const toRole = (role: MessageInfo['role']): ChatMessageRole => {
  if (role === 'USER') return 'user';
  if (role === 'SYSTEM') return 'system';
  if (role === 'FUNCTION') return 'tool';
  return 'assistant';
};

const toStatus = (status: MessageInfo['status']): ChatMessageStatus => {
  if (status === 'loading' || status === 'incomplete') return 'streaming';
  if (status === 'error') return 'error';
  if (status === 'stopped') return 'stopped';
  return 'complete';
};

const toToolPart = (
  processing: ProcessingInfo,
  index: number,
): ChatMessagePart => ({
  type: 'tool',
  id: asId(processing.executeId, `tool-${index}`),
  name: processing.name,
  status:
    processing.status === 'EXECUTING'
      ? 'running'
      : processing.status === 'FAILED'
      ? 'error'
      : 'complete',
  input: processing.result?.input,
  output: processing.result?.error || processing.result?.innerExecuteInfo,
});

/** Converts the Nuwax API model into the shared, renderer-neutral chat model. */
export function toChatKitMessage(
  message: MessageInfo,
  conversationId: number | string,
  fallbackIndex = 0,
): ChatMessage {
  const parts: ChatMessagePart[] = [];
  if (message.think) {
    parts.push({
      type: 'thinking',
      text: message.think,
      status:
        toStatus(message.status) === 'streaming' ? 'streaming' : 'complete',
    });
  }
  if (message.text) parts.push({ type: 'text', text: message.text });
  for (const attachment of message.attachments ?? []) {
    parts.push({
      type: 'attachment',
      attachment: {
        id: attachment.fileKey,
        key: attachment.fileKey,
        url: attachment.fileUrl,
        name: attachment.fileName,
        mimeType: attachment.mimeType,
      },
    });
  }
  for (const [index, processing] of (message.processingList ?? []).entries()) {
    parts.push(toToolPart(processing, index));
  }
  for (const interaction of message.acpPermissionInteractions ?? []) {
    parts.push({
      type: 'interaction',
      id: asId(interaction.id, `permission-${parts.length}`),
      kind: 'permission',
      payload: interaction,
    });
  }
  for (const interaction of message.mcpAskInteractions ?? []) {
    parts.push({
      type: 'interaction',
      id: asId(interaction.toolCallId, `question-${parts.length}`),
      kind: 'question',
      payload: interaction,
    });
  }

  const sourceIndex = message.index ?? fallbackIndex;
  return {
    // 有真实 id 时直接用作稳定 key，避免终态快照补齐 index 后 id 变化导致节点重挂/闪烁；
    // 仅无 id 的 opening 消息用 `opening:index` 消歧（index 仍可通过 metadata.sourceIndex 取得）。
    id: message.id ? String(message.id) : `opening:${sourceIndex}`,
    conversationId: String(conversationId),
    role: toRole(message.role),
    status: toStatus(message.status),
    parts,
    createdAt: message.time,
    metadata: {
      sourceIndex,
      requestId: message.requestId,
      finishReason: message.finishReason,
    },
  };
}

export function toChatKitConversation(
  conversation: ConversationInfo,
): ChatConversation {
  return {
    id: String(conversation.id),
    agentId: String(conversation.agentId),
    title: conversation.topic || conversation.agent?.name || 'New conversation',
    summary: conversation.summary,
    createdAt: conversation.created,
    updatedAt: conversation.modified || conversation.created,
    status: conversation.taskStatus === 'EXECUTING' ? 'executing' : 'idle',
    metadata: {
      uid: conversation.uid,
      icon: conversation.icon || conversation.agent?.icon,
    },
  };
}
