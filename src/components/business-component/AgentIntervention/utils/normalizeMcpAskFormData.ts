import { UploadFileStatus } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { InteractionUiSchema } from '../types/mcpAskIntervention';
import { parseInteractionFields } from './parseMcpAskSchema';

/** 判断是否为统一文件上传服务返回的可访问远程 URL */
export function isRemoteFileUrl(url: unknown): url is string {
  return (
    typeof url === 'string' &&
    (url.startsWith('http://') || url.startsWith('https://'))
  );
}

function isUploadFileInfoLike(item: unknown): item is UploadFileInfo {
  return (
    !!item &&
    typeof item === 'object' &&
    ('url' in item || 'name' in item || 'uid' in item)
  );
}

/**
 * 从表单原始值中提取已上传文件的远程 URL 列表。
 * 兼容：已是 URL 字符串、URL 数组、UploadFileInfo 对象或数组。
 */
export function extractUploadedFileUrls(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (typeof value === 'string') {
    return isRemoteFileUrl(value) ? [value] : [];
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'string')) {
      return value.filter(isRemoteFileUrl);
    }

    return value
      .filter(isUploadFileInfoLike)
      .filter((item) => item.status !== UploadFileStatus.removed)
      .map((item) => item.url)
      .filter(isRemoteFileUrl);
  }

  if (isUploadFileInfoLike(value)) {
    return isRemoteFileUrl(value.url) ? [value.url] : [];
  }

  return [];
}

/**
 * 校验必填 file 字段是否已有统一上传服务返回的远程 URL。
 * 供 McpAskFormField 的 Form.Item validator 复用。
 */
export function validateMcpAskRequiredFileField(value: unknown): void {
  if (!extractUploadedFileUrls(value).length) {
    throw new Error('MCP_ASK_FILE_REQUIRED');
  }
}

/**
 * 将单个 file 字段值归一化为提交用 URL。
 * - multiple: string[]
 * - 单文件: string（无有效 URL 时为空字符串）
 */
export function normalizeMcpAskFileFieldValue(
  value: unknown,
  multiple?: boolean,
): string | string[] {
  const urls = extractUploadedFileUrls(value);
  if (multiple) {
    return urls;
  }
  return urls[0] ?? '';
}

/**
 * 提交前将 MCP Ask 表单中的 file 字段转为统一文件上传服务返回的 URL。
 */
export function normalizeMcpAskFormData(
  formData: Record<string, unknown>,
  ui: InteractionUiSchema,
): Record<string, unknown> {
  const normalized = { ...formData };

  parseInteractionFields(ui).forEach((field) => {
    if (field.widget !== 'file') {
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(normalized, field.name)) {
      return;
    }
    normalized[field.name] = normalizeMcpAskFileFieldValue(
      normalized[field.name],
      field.options.multiple,
    );
  });

  return normalized;
}

function inferFileNameFromUrl(url: string): string {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop();
    return segment || 'file';
  } catch {
    return 'file';
  }
}

/** 将单个远程 URL 转为 Upload 组件可识别的已完成文件项 */
export function urlToUploadFileInfo(url: string, index = 0): UploadFileInfo {
  return {
    uid: `mcp-ask-url-${index}-${url}`,
    name: inferFileNameFromUrl(url),
    type: '',
    size: 0,
    url,
    status: UploadFileStatus.done,
  };
}

/**
 * 将已提交的 URL 表单值还原为 Upload fileList，避免回填时破坏 Upload 控件。
 * 若值本身已是 UploadFileInfo[]，则原样返回。
 */
export function hydrateMcpAskFileFieldValue(
  value: unknown,
  multiple?: boolean,
): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (
    Array.isArray(value) &&
    value.length > 0 &&
    isUploadFileInfoLike(value[0])
  ) {
    return value;
  }

  if (isUploadFileInfoLike(value)) {
    return [value];
  }

  const urls = extractUploadedFileUrls(value);
  if (!urls.length) {
    return undefined;
  }

  const limitedUrls = multiple ? urls : urls.slice(0, 1);
  return limitedUrls.map((url, index) => urlToUploadFileInfo(url, index));
}

/**
 * 回填表单前，将 file 字段的 URL 值转为 Upload fileList。
 */
export function hydrateMcpAskFormValues(
  formData: Record<string, unknown>,
  ui: InteractionUiSchema,
): Record<string, unknown> {
  const hydrated = { ...formData };

  parseInteractionFields(ui).forEach((field) => {
    if (field.widget !== 'file') {
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(hydrated, field.name)) {
      return;
    }
    hydrated[field.name] = hydrateMcpAskFileFieldValue(
      hydrated[field.name],
      field.options.multiple,
    );
  });

  return hydrated;
}

/**
 * 单文件字段仅保留最后一个已选文件，防止多选后静默丢文件。
 */
export function limitMcpAskUploadFileList(
  fileList: UploadFileInfo[],
  multiple?: boolean,
): UploadFileInfo[] {
  if (multiple || fileList.length <= 1) {
    return fileList;
  }
  return fileList.slice(-1);
}
