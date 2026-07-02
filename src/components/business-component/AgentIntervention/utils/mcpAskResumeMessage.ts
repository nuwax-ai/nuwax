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

/** resume 消息 JSON 块中的 requestId 键（历史 fenced JSON 格式，仍识别） */
export const MCP_ASK_REQUEST_ID_MARKER_KEY = 'nuwaxMcpAskRequestId';

/** HTML 注释标记前缀，对用户不可见 */
const MCP_ASK_REQUEST_ID_HTML_PREFIX = 'nuwax-mcp-ask-request-id:';

export interface McpAskResumeMatchOptions {
  /** 承载该 interaction 的消息在已排序列表中的下标 */
  containingMessageIndex?: number;
}

/**
 * 按会话 message.index 升序排列，与 intervention 队列保持一致。
 */
export function sortMessagesByConversationIndex(
  messages: MessageInfo[],
): MessageInfo[] {
  return [...(messages ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

function readMessageOrdinal(message: MessageInfo, fallback = 0): number {
  return message.index ?? fallback;
}

/**
 * 生成附在 resume 消息末尾的 HTML 注释 requestId 标记（聊天 UI 不展示）。
 */
export function buildMcpAskRequestIdMarker(requestId: string): string {
  return `\n<!--${MCP_ASK_REQUEST_ID_HTML_PREFIX}${requestId}-->`;
}

function messageHasForeignRequestIdMarker(text: string): boolean {
  return (
    text.includes(MCP_ASK_REQUEST_ID_HTML_PREFIX) ||
    text.includes(MCP_ASK_REQUEST_ID_MARKER_KEY)
  );
}

/**
 * 判断文本是否包含指定 requestId 的 resume 标记（HTML 注释或历史 JSON 块）。
 */
export function textContainsMcpAskRequestIdMarker(
  text: string | undefined,
  requestId: string,
): boolean {
  if (!text || !requestId) {
    return false;
  }
  if (text.includes(`<!--${MCP_ASK_REQUEST_ID_HTML_PREFIX}${requestId}-->`)) {
    return true;
  }
  const compact = `"${MCP_ASK_REQUEST_ID_MARKER_KEY}":"${requestId}"`;
  const spaced = `"${MCP_ASK_REQUEST_ID_MARKER_KEY}": "${requestId}"`;
  return text.includes(compact) || text.includes(spaced);
}

function appendMcpAskRequestIdMarker(
  message: string,
  requestId: string,
): string {
  return `${message}${buildMcpAskRequestIdMarker(requestId)}`;
}

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
              f.url ||
              f.name ||
              f.fileName ||
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
      return `📎 ${
        obj.url || obj.name || obj.fileName || tMcpAsk(`${I18N_PREFIX}.file`)
      }`;
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

/**
 * 会话中已有更早（或同条 assistant 消息内）其他同 title 询问时，
 * 无 marker 的 legacy 标题匹配不可靠，应仅依赖 requestId 标记。
 */
function shouldBlockLegacyTitleMatch(
  sortedMessages: MessageInfo[],
  containingMessage: MessageInfo | undefined,
  containingOrdinal: number | undefined,
  interaction: McpAskInteraction,
): boolean {
  if (!containingMessage || containingOrdinal === undefined) {
    return false;
  }
  const title = getMcpAskResumeTitle(interaction);

  return sortedMessages.some((message) => {
    const ordinal = readMessageOrdinal(message, 0);
    const isEarlier = ordinal < containingOrdinal;
    const isSameMessage =
      (containingMessage.id !== undefined &&
        message.id === containingMessage.id) ||
      (containingMessage.index !== undefined &&
        message.index === containingMessage.index);
    if (!isEarlier && !isSameMessage) {
      return false;
    }

    return (message.mcpAskInteractions ?? []).some(
      (item) =>
        item.input.requestId !== interaction.input.requestId &&
        getMcpAskResumeTitle(item) === title,
    );
  });
}

function resolveContainingMessageIndex(
  sortedMessages: MessageInfo[],
  interaction: McpAskInteraction,
  explicitIndex?: number,
): number | undefined {
  if (explicitIndex !== undefined && explicitIndex >= 0) {
    return explicitIndex;
  }
  const autoIndex = sortedMessages.findIndex((message) =>
    message.mcpAskInteractions?.some(
      (item) => item.input.requestId === interaction.input.requestId,
    ),
  );
  return autoIndex >= 0 ? autoIndex : undefined;
}

export function buildMcpAskResumeMessage(
  interaction: McpAskInteraction,
  payload: McpAskRespondPayload,
) {
  const title = getMcpAskResumeTitle(interaction);
  const requestId = interaction.input.requestId;
  let message: string;

  if (payload.action === 'cancel') {
    message = tMcpAsk(RESUME_MESSAGE_KEY_BY_ACTION.cancel, title);
  } else if (payload.action === 'skip') {
    message = tMcpAsk(RESUME_MESSAGE_KEY_BY_ACTION.skip, title);
  } else if (payload.action === 'timeout') {
    message = tMcpAsk(RESUME_MESSAGE_KEY_BY_ACTION.timeout, title);
  } else {
    message = [
      tMcpAsk(SUBMITTED_HEADER_KEY, title),
      formatAskFormData(interaction, payload.formData),
    ].join('\n');
  }

  return appendMcpAskRequestIdMarker(message, requestId);
}

function matchesLegacyTitleResumeMessage(
  text: string,
  interaction: McpAskInteraction,
): boolean {
  // 带其他 requestId 标记的 resume 不应被同 title 的后续 ask 误匹配
  if (
    messageHasForeignRequestIdMarker(text) &&
    !textContainsMcpAskRequestIdMarker(text, interaction.input.requestId)
  ) {
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

export function isMcpAskResumeMessageForInteraction(
  text: string | undefined,
  interaction: McpAskInteraction,
  options?: { legacyTitleMatch?: boolean },
): boolean {
  if (!text) {
    return false;
  }

  if (textContainsMcpAskRequestIdMarker(text, interaction.input.requestId)) {
    return true;
  }

  if (options?.legacyTitleMatch === false) {
    return false;
  }

  return matchesLegacyTitleResumeMessage(text, interaction);
}

export function hasMcpAskResumeMessage(
  messages: MessageInfo[],
  interaction: McpAskInteraction,
  options?: McpAskResumeMatchOptions,
): boolean {
  const sortedMessages = sortMessagesByConversationIndex(messages);
  const containingMessageIndex = resolveContainingMessageIndex(
    sortedMessages,
    interaction,
    options?.containingMessageIndex,
  );
  const containingMessage =
    containingMessageIndex !== undefined
      ? sortedMessages[containingMessageIndex]
      : undefined;
  const containingOrdinal = containingMessage
    ? readMessageOrdinal(containingMessage, containingMessageIndex ?? 0)
    : undefined;

  if (
    sortedMessages.some((message) =>
      textContainsMcpAskRequestIdMarker(
        message.text,
        interaction.input.requestId,
      ),
    )
  ) {
    return true;
  }

  if (
    shouldBlockLegacyTitleMatch(
      sortedMessages,
      containingMessage,
      containingOrdinal,
      interaction,
    )
  ) {
    return false;
  }

  const matchesLegacy = (text: string | undefined) =>
    text ? matchesLegacyTitleResumeMessage(text, interaction) : false;

  if (containingOrdinal !== undefined) {
    const afterMessages = sortedMessages.filter(
      (message) => readMessageOrdinal(message, 0) > containingOrdinal,
    );
    if (afterMessages.some((message) => matchesLegacy(message.text))) {
      return true;
    }

    // 历史 hydrate：resume 的 index 可能小于 ask（存储乱序），仅匹配无 marker 的旧消息
    const beforeMessages = sortedMessages.filter(
      (message) =>
        readMessageOrdinal(message, 0) < containingOrdinal &&
        !messageHasForeignRequestIdMarker(message.text ?? ''),
    );
    return beforeMessages.some((message) => matchesLegacy(message.text));
  }

  return sortedMessages.some((message) => matchesLegacy(message.text));
}

export function hasLaterMcpAskResumeMessage(
  messages: MessageInfo[],
  messageIndex: number,
  interaction: McpAskInteraction,
): boolean {
  return hasMcpAskResumeMessage(messages, interaction, {
    containingMessageIndex: messageIndex,
  });
}
