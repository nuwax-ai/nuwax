import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';
import { parseInteractionFields } from './parseMcpAskSchema';

function stringifyDisplayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '未填写';
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return '未填写';
    }
    // 检查是否为文件上传数组 (UploadFileInfo[])
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const first = value[0] as any;
      if ('name' in first || 'url' in first || 'fileName' in first) {
        return value
          .map((f: any) => f.name || f.fileName || f.url || '未知文件')
          .join('、');
      }
    }
    return value.map(stringifyDisplayValue).join('、');
  }
  if (typeof value === 'object') {
    // 检查是否为单个文件对象
    const obj = value as any;
    if (obj.name || obj.fileName || obj.url) {
      return `📎 ${obj.name || obj.fileName || '文件'}`;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) {
      return '未填写';
    }
    return entries
      .map(([key, item]) => `${key}: ${stringifyDisplayValue(item)}`)
      .join('，');
  }
  return String(value);
}

function formatFieldValue(
  value: unknown,
  enumValues: string[],
  enumLabels: string[],
): string {
  const labelByValue = new Map(
    enumValues.map((item, index) => [item, enumLabels[index] ?? item]),
  );

  if (Array.isArray(value)) {
    return stringifyDisplayValue(
      value.map((item) =>
        typeof item === 'string' ? labelByValue.get(item) ?? item : item,
      ),
    );
  }

  if (typeof value === 'string') {
    return labelByValue.get(value) ?? value;
  }

  return stringifyDisplayValue(value);
}

function formatAskFormData(
  interaction: McpAskInteraction,
  formData?: Record<string, unknown>,
) {
  if (!formData || Object.keys(formData).length === 0) {
    return '（无表单内容）';
  }

  const fields = parseInteractionFields(interaction.input.ui);
  const consumedKeys = new Set<string>();
  const lines = fields
    .filter((field) =>
      Object.prototype.hasOwnProperty.call(formData, field.name),
    )
    .map((field) => {
      consumedKeys.add(field.name);
      const label = field.property.title || field.name;
      const otherValue = field.options.otherValue ?? '__custom__';
      const otherField = field.options.otherField ?? `${field.name}Custom`;
      if (
        field.widget === 'radio-with-custom' &&
        formData[field.name] === otherValue &&
        Object.prototype.hasOwnProperty.call(formData, otherField)
      ) {
        consumedKeys.add(otherField);
        return `${label}：${stringifyDisplayValue(formData[otherField])}`;
      }
      const value = formatFieldValue(
        formData[field.name],
        field.enumValues,
        field.enumLabels,
      );
      return `${label}：${value}`;
    });

  Object.entries(formData).forEach(([key, value]) => {
    if (!consumedKeys.has(key)) {
      lines.push(`${key}：${stringifyDisplayValue(value)}`);
    }
  });

  return lines.length ? lines.join('\n') : '（无表单内容）';
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
    formatAskFormData(interaction, payload.formData),
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
