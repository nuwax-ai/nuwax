import {
  MIN_EN_I18N_MAP,
  MIN_JA_I18N_MAP,
  MIN_ZH_HK_I18N_MAP,
  MIN_ZH_I18N_MAP,
  MIN_ZH_TW_I18N_MAP,
} from '@/constants/i18n.constants';
import { dict, getCurrentLang } from '@/services/i18nRuntime';
import type {
  AttachmentFile,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
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

/** 匹配 resume 消息末尾附带的 HTML 注释 requestId 标记 */
const MCP_ASK_REQUEST_ID_HTML_COMMENT_RE =
  /\n?<!--nuwax-mcp-ask-request-id:[^>]+-->/g;

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

/**
 * 移除 resume 消息中仅供内部匹配的 requestId 标记，供聊天 UI 展示与复制使用。
 * 原始 message.text 仍保留标记，以便 hasMcpAskResumeMessage 等逻辑识别。
 */
export function stripMcpAskResumeDisplayArtifacts(
  text: string | undefined,
): string {
  if (!text) {
    return '';
  }
  return text
    .replace(MCP_ASK_REQUEST_ID_HTML_COMMENT_RE, '')
    .replace(/\s+$/, '');
}

/** 用户消息展示：单字段解析结果 */
export interface McpAskResumeDisplayField {
  label: string;
  /** 非 URL 的纯文本值 */
  textValue?: string;
  /** 图片字段的远程 URL 列表（支持多张） */
  imageUrls?: string[];
  /** 文档等非图片远程文件 URL 列表（支持多个） */
  fileUrls?: string[];
}

/** 用户消息展示：MCP Ask 提交 resume 解析结果 */
export interface McpAskResumeDisplayContent {
  kind: 'plain' | 'resume';
  /** kind=plain 时的完整展示文本 */
  plainText?: string;
  preamble?: string;
  fields?: McpAskResumeDisplayField[];
}

const REMOTE_IMAGE_URL_RE = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|#|$)/i;

const MCP_ASK_SUBMITTED_PREAMBLE_RE =
  /^(我已填写「.+」|我已填寫「.+」|I filled out ".+"\.?|I answered ".+"\.)/i;

const MCP_ASK_FIELD_LINE_RE = /^(.+?)[：:]\s*(.+)$/;

/**
 * 判断远程 URL 是否指向常见图片资源。
 */
export function isRemoteImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }
  try {
    return REMOTE_IMAGE_URL_RE.test(new URL(trimmed).pathname);
  } catch {
    return REMOTE_IMAGE_URL_RE.test(trimmed);
  }
}

/**
 * 判断远程 URL 是否为非图片文件（http(s) 且非图片扩展名）。
 */
export function isRemoteFileUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }
  return !isRemoteImageUrl(trimmed);
}

function splitResumeFieldValue(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  if (!trimmed.includes('、') && !trimmed.includes(',')) {
    return [trimmed];
  }
  return trimmed.split(/\s*[、,]\s*/).filter(Boolean);
}

function isMcpAskSubmittedResumePreamble(line: string): boolean {
  return MCP_ASK_SUBMITTED_PREAMBLE_RE.test(line.trim());
}

function parseResumeFieldLine(line: string): McpAskResumeDisplayField | null {
  const match = line.match(MCP_ASK_FIELD_LINE_RE);
  if (!match) {
    return null;
  }
  const label = match[1].trim();
  const rawValue = match[2].trim();
  const parts = splitResumeFieldValue(rawValue);
  const imageUrls = parts.filter((part) => isRemoteImageUrl(part));
  const fileUrls = parts.filter((part) => isRemoteFileUrl(part));
  const textParts = parts.filter(
    (part) => !isRemoteImageUrl(part) && !isRemoteFileUrl(part),
  );

  if (imageUrls.length > 0 || fileUrls.length > 0) {
    return {
      label,
      imageUrls: imageUrls.length ? imageUrls : undefined,
      fileUrls: fileUrls.length ? fileUrls : undefined,
      textValue: textParts.length ? textParts.join('、') : undefined,
    };
  }

  return {
    label,
    textValue: rawValue,
  };
}

/**
 * 解析 MCP Ask 提交 resume 用户消息，供聊天 UI 结构化展示（含多图预览）。
 * 发给 Agent 的原始 message.text 不变；仅展示层调用。
 */
export function parseMcpAskResumeDisplayContent(
  text: string | undefined,
): McpAskResumeDisplayContent {
  const stripped = stripMcpAskResumeDisplayArtifacts(text);
  if (!stripped.trim()) {
    return { kind: 'plain', plainText: '' };
  }

  const lines = stripped
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length || !isMcpAskSubmittedResumePreamble(lines[0])) {
    return { kind: 'plain', plainText: stripped };
  }

  const fields: McpAskResumeDisplayField[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const field = parseResumeFieldLine(lines[index]);
    if (field) {
      fields.push(field);
    }
  }

  if (!fields.length) {
    return { kind: 'plain', plainText: stripped };
  }

  return {
    kind: 'resume',
    preamble: lines[0],
    fields,
  };
}

// ---------------------------------------------------------------------------
// 以下函数仅用于聊天 UI 展示层，不参与 buildMcpAskResumeMessage / 发送链路。
// message.text 仍保留完整 URL 与 requestId 标记，供 Agent 与 resume 匹配使用。
// ---------------------------------------------------------------------------

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

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
};

const FILE_MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  txt: 'text/plain',
  csv: 'text/csv',
  md: 'text/markdown',
};

function extractFileNameFromUrl(url: string, fallback: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').filter(Boolean).pop() || fallback;
  } catch {
    return url.split('/').filter(Boolean).pop() || fallback;
  }
}

function resolveMimeTypeByFileName(fileName: string, fallback: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return FILE_MIME_BY_EXT[ext] || IMAGE_MIME_BY_EXT[ext] || fallback;
}

/** 将 resume 消息中的远程图片 URL 转为会话附件结构，复用用户上传附件展示组件 */
export function imageUrlToAttachmentFile(
  url: string,
  index = 0,
): AttachmentFile {
  const fileName =
    extractFileNameFromUrl(url, `image-${index + 1}`) || `image-${index + 1}`;
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'png';
  return {
    fileKey: url,
    fileUrl: url,
    fileName,
    mimeType: IMAGE_MIME_BY_EXT[ext] || 'image/png',
  };
}

/** 将 resume 消息中的远程文档 URL 转为会话附件结构，供附件卡片展示 */
export function fileUrlToAttachmentFile(
  url: string,
  index = 0,
): AttachmentFile {
  const fileName =
    extractFileNameFromUrl(url, `file-${index + 1}`) || `file-${index + 1}`;
  return {
    fileKey: url,
    fileUrl: url,
    fileName,
    mimeType: resolveMimeTypeByFileName(fileName, 'application/octet-stream'),
  };
}

/** 提取 MCP Ask resume 消息中的全部图片附件（保持字段顺序，支持多图） */
export function extractMcpAskResumeImageAttachments(
  text: string | undefined,
): AttachmentFile[] {
  const parsed = parseMcpAskResumeDisplayContent(text);
  if (parsed.kind !== 'resume' || !parsed.fields?.length) {
    return [];
  }

  const attachments: AttachmentFile[] = [];
  parsed.fields.forEach((field) => {
    field.imageUrls?.forEach((url) => {
      attachments.push(imageUrlToAttachmentFile(url, attachments.length));
    });
  });
  return attachments;
}

/** 提取 MCP Ask resume 消息中的全部文档附件（保持字段顺序） */
export function extractMcpAskResumeDocumentAttachments(
  text: string | undefined,
): AttachmentFile[] {
  const parsed = parseMcpAskResumeDisplayContent(text);
  if (parsed.kind !== 'resume' || !parsed.fields?.length) {
    return [];
  }

  const attachments: AttachmentFile[] = [];
  parsed.fields.forEach((field) => {
    field.fileUrls?.forEach((url) => {
      attachments.push(fileUrlToAttachmentFile(url, attachments.length));
    });
  });
  return attachments;
}

/**
 * 构建 MCP Ask resume 的用户可见文本（不含图片/文档 URL，媒体走卡片展示）。
 */
export function buildMcpAskResumeTextDisplay(text: string | undefined): string {
  const parsed = parseMcpAskResumeDisplayContent(text);
  if (parsed.kind !== 'resume') {
    return stripMcpAskResumeDisplayArtifacts(text);
  }

  const { labelSeparator } = getMcpAskDisplaySeparators();
  const lines: string[] = [];
  if (parsed.preamble) {
    lines.push(parsed.preamble);
  }
  parsed.fields?.forEach((field) => {
    if (field.textValue) {
      lines.push(`${field.label}${labelSeparator}${field.textValue}`);
      return;
    }
    if (field.imageUrls?.length || field.fileUrls?.length) {
      lines.push(`${field.label}${labelSeparator}`);
    }
  });
  return lines.join('\n');
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

function formatFileFieldDisplayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return tMcpAsk(`${I18N_PREFIX}.notFilled`);
  }

  const formatSingle = (item: unknown): string => {
    if (typeof item === 'string') {
      return item;
    }
    if (typeof item === 'object' && item !== null) {
      const file = item as {
        name?: string;
        fileName?: string;
        url?: string;
      };
      return (
        file.url ||
        file.name ||
        file.fileName ||
        tMcpAsk(`${I18N_PREFIX}.unknownFile`)
      );
    }
    return String(item);
  };

  const { listSeparator } = getMcpAskDisplaySeparators();
  if (Array.isArray(value)) {
    if (!value.length) {
      return tMcpAsk(`${I18N_PREFIX}.notFilled`);
    }
    return value.map(formatSingle).join(listSeparator);
  }

  return formatSingle(value);
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
        return formatFileFieldDisplayValue(value);
      }
    }
    return value.map(stringifyDisplayValue).join(listSeparator);
  }
  if (typeof value === 'object') {
    // 检查是否为单个文件对象
    const obj = value as any;
    if (obj.name || obj.fileName || obj.url) {
      return `📎 ${formatFileFieldDisplayValue(value)}`;
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
      const rawValue = formData[field.name];
      const value =
        field.widget === 'file'
          ? formatFileFieldDisplayValue(rawValue)
          : formatFieldValue(rawValue, field.enumValues, field.enumLabels);
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
