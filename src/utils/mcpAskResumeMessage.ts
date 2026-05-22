import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '@/types/interfaces/mcpAskIntervention';

function formatAskFormData(formData?: Record<string, unknown>) {
  if (!formData || Object.keys(formData).length === 0) {
    return '（无表单内容）';
  }
  return JSON.stringify(formData, null, 2);
}

export function getMcpAskResumeTitle(interaction: McpAskInteraction): string {
  return interaction.input.title || interaction.input.ui.title || '这次提问';
}

export function buildMcpAskResumeMessage(
  interaction: McpAskInteraction,
  payload: McpAskRespondPayload,
) {
  const title = getMcpAskResumeTitle(interaction);

  if (payload.action === 'cancel') {
    return `我取消了「${title}」。`;
  }
  if (payload.action === 'skip') {
    return `我跳过了「${title}」。`;
  }
  if (payload.action === 'timeout') {
    return `「${title}」已超时，没有收到表单答案。`;
  }

  return [
    `我已填写「${title}」，表单内容如下：`,
    '',
    '```json',
    formatAskFormData(payload.formData),
    '```',
  ].join('\n');
}

export function isMcpAskResumeMessageForInteraction(
  text: string | undefined,
  interaction: McpAskInteraction,
): boolean {
  if (!text) {
    return false;
  }
  const title = getMcpAskResumeTitle(interaction);
  return (
    text.includes(`我已填写「${title}」`) ||
    text.includes(`我取消了「${title}」`) ||
    text.includes(`我跳过了「${title}」`) ||
    text.includes(`「${title}」已超时`)
  );
}

export function hasLaterMcpAskResumeMessage(
  messages: MessageInfo[],
  messageIndex: number,
  interaction: McpAskInteraction,
): boolean {
  return messages
    .slice(messageIndex + 1)
    .some((message) =>
      isMcpAskResumeMessageForInteraction(message.text, interaction),
    );
}

export function hasMcpAskResumeMessage(
  messages: MessageInfo[],
  interaction: McpAskInteraction,
): boolean {
  return messages.some((message) =>
    isMcpAskResumeMessageForInteraction(message.text, interaction),
  );
}
