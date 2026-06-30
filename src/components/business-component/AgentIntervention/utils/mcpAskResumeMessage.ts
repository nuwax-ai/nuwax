import {
  MIN_EN_I18N_MAP,
  MIN_JA_I18N_MAP,
  MIN_ZH_HK_I18N_MAP,
  MIN_ZH_I18N_MAP,
  MIN_ZH_TW_I18N_MAP,
} from '@/constants/i18n.constants';
import { dict, getCurrentLang } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';
import { parseInteractionFields } from './parseMcpAskSchema';

/** MCP Ask resume 消息相关的 i18n key 前缀 */
const I18N_PREFIX = 'PC.Components.McpAskQuestionCard';

type McpAskResumeAction = 'submit' | 'cancel' | 'skip' | 'timeout';

const RESUME_MESSAGE_KEY_BY_ACTION: Record<
  Exclude<McpAskResumeAction, 'submit'>,
  string
> = {
  cancel: `${I18N_PREFIX}.resumeCancelled`,
  skip: `${I18N_PREFIX}.resumeSkipped`,
  timeout: `${I18N_PREFIX}.resumeTimeout`,
};

const SUBMITTED_HEADER_KEY = `${I18N_PREFIX}.resumeSubmitted`;

/** 各语言本地包，用于跨语言匹配历史 resume 消息 */
const LOCAL_RESUME_MESSAGE_MAPS = [
  MIN_ZH_I18N_MAP,
  MIN_ZH_TW_I18N_MAP,
  MIN_ZH_HK_I18N_MAP,
  MIN_EN_I18N_MAP,
  MIN_JA_I18N_MAP,
] as const;

/**
 * 迁移期兜底：旧版硬编码中文 resume 消息首行片段。
 * 用于识别切换语言前已发送的历史消息。
 */
const LEGACY_RESUME_MESSAGE_SNIPPETS_BY_ACTION: Record<
  McpAskResumeAction,
  (title: string) => string
> = {
  submit: (title) => `我已填写「${title}」`,
  cancel: (title) => `我取消了「${title}」`,
  skip: (title) => `我跳过了「${title}」`,
  timeout: (title) => `「${title}」已超时`,
};

/**
 * 按模板与占位符生成文案（不依赖当前运行时语言）。
 */
function formatTemplate(template: string, values: (string | number)[]): string {
  let text = template;
  values.forEach((value, index) => {
    text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), String(value ?? ''));
  });
  return text;
}

/**
 * 从指定语言包读取 resume 消息模板并格式化。
 */
function formatResumeMessageFromMap(
  map: Record<string, string>,
  key: string,
  title: string,
): string | undefined {
  const template = map[key];
  if (!template?.trim()) {
    return undefined;
  }
  return formatTemplate(template, [title]);
}

/**
 * 收集某标题下所有语言的 resume 消息签名，供历史消息识别使用。
 */
function collectResumeMessageSignatures(
  title: string,
  action: McpAskResumeAction,
): string[] {
  const key =
    action === 'submit'
      ? SUBMITTED_HEADER_KEY
      : RESUME_MESSAGE_KEY_BY_ACTION[action];
  const signatures = new Set<string>();

  LOCAL_RESUME_MESSAGE_MAPS.forEach((map) => {
    const formatted = formatResumeMessageFromMap(map, key, title);
    if (formatted) {
      signatures.add(formatted);
      // submit 消息可能有多行，仅用首行做 includes 匹配
      if (action === 'submit') {
        signatures.add(formatted.split('\n')[0]);
      }
    }
  });

  signatures.add(LEGACY_RESUME_MESSAGE_SNIPPETS_BY_ACTION[action](title));

  return [...signatures];
}

function tMcpAsk(key: string, ...values: (string | number)[]): string {
  return dict(key, ...values);
}

/** MCP Ask resume 表单展示用标点：英文 locale 用西式标点，其余语系用 CJK 标点 */
function getMcpAskDisplaySeparators(lang = getCurrentLang()) {
  const isEnglish = lang.toLowerCase().startsWith('en');
  if (isEnglish) {
    return {
      listSeparator: ', ',
      objectEntrySeparator: '; ',
      labelSeparator: ': ',
    };
  }
  return {
    listSeparator: '、',
    objectEntrySeparator: '，',
    labelSeparator: '：',
  };
}

function stringifyDisplayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return tMcpAsk(`${I18N_PREFIX}.notFilled`);
  }
  if (typeof value === 'boolean') {
    return value
      ? tMcpAsk('PC.Common.Global.yes')
      : tMcpAsk('PC.Common.Global.no');
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  const { listSeparator, objectEntrySeparator, labelSeparator } =
    getMcpAskDisplaySeparators();

  if (Array.isArray(value)) {
    if (!value.length) {
      return tMcpAsk(`${I18N_PREFIX}.notFilled`);
    }
    // 检查是否为文件上传数组 (UploadFileInfo[])
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const first = value[0] as any;
      if ('name' in first || 'url' in first || 'fileName' in first) {
        return value
          .map(
            (f: any) =>
              f.name ||
              f.fileName ||
              f.url ||
              tMcpAsk(`${I18N_PREFIX}.unknownFile`),
          )
          .join(listSeparator);
      }
    }
    return value.map(stringifyDisplayValue).join(listSeparator);
  }
  if (typeof value === 'object') {
    // 检查是否为单个文件对象
    const obj = value as any;
    if (obj.name || obj.fileName || obj.url) {
      return `📎 ${obj.name || obj.fileName || tMcpAsk(`${I18N_PREFIX}.file`)}`;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) {
      return tMcpAsk(`${I18N_PREFIX}.notFilled`);
    }
    return entries
      .map(
        ([key, item]) =>
          `${key}${labelSeparator}${stringifyDisplayValue(item)}`,
      )
      .join(objectEntrySeparator);
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
  const emptyFormContent = tMcpAsk(`${I18N_PREFIX}.emptyFormContent`);
  if (!formData || Object.keys(formData).length === 0) {
    return emptyFormContent;
  }

  const { labelSeparator } = getMcpAskDisplaySeparators();
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
        return `${label}${labelSeparator}${stringifyDisplayValue(
          formData[otherField],
        )}`;
      }
      const value = formatFieldValue(
        formData[field.name],
        field.enumValues,
        field.enumLabels,
      );
      return `${label}${labelSeparator}${value}`;
    });

  Object.entries(formData).forEach(([key, value]) => {
    if (!consumedKeys.has(key)) {
      lines.push(`${key}${labelSeparator}${stringifyDisplayValue(value)}`);
    }
  });

  return lines.length ? lines.join('\n') : emptyFormContent;
}

export function getMcpAskResumeTitle(interaction: McpAskInteraction): string {
  return (
    interaction.input.title ||
    interaction.input.ui.title ||
    tMcpAsk(`${I18N_PREFIX}.defaultTitle`)
  );
}

export function buildMcpAskResumeMessage(
  interaction: McpAskInteraction,
  payload: McpAskRespondPayload,
) {
  const title = getMcpAskResumeTitle(interaction);

  if (payload.action === 'cancel') {
    return tMcpAsk(RESUME_MESSAGE_KEY_BY_ACTION.cancel, title);
  }
  if (payload.action === 'skip') {
    return tMcpAsk(RESUME_MESSAGE_KEY_BY_ACTION.skip, title);
  }
  if (payload.action === 'timeout') {
    return tMcpAsk(RESUME_MESSAGE_KEY_BY_ACTION.timeout, title);
  }

  return [
    tMcpAsk(SUBMITTED_HEADER_KEY, title),
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
  const actions: McpAskResumeAction[] = ['submit', 'cancel', 'skip', 'timeout'];

  return actions.some((action) =>
    collectResumeMessageSignatures(title, action).some((signature) =>
      text.includes(signature),
    ),
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
