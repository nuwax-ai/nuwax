/**
 * 聊天相关工具函数
 * 基于新的 OpenAPI 规范
 */

import type { Attachment, AttachmentSource } from '@/types/interfaces/appDev';

/**
 * 创建文件路径附件源
 * @param path 文件路径
 * @returns AttachmentSource
 */
export const createFilePathSource = (path: string): AttachmentSource => ({
  source_type: 'FilePath',
  data: { path },
});

/**
 * 创建 Base64 附件源
 * @param data Base64 数据
 * @param mimeType MIME 类型
 * @returns AttachmentSource
 */
export const createBase64Source = (
  data: string,
  mimeType: string,
): AttachmentSource => ({
  source_type: 'Base64',
  data: { data, mime_type: mimeType },
});

/**
 * 创建 URL 附件源
 * @param url URL 地址
 * @returns AttachmentSource
 */
export const createUrlSource = (url: string): AttachmentSource => ({
  source_type: 'Url',
  data: { url },
});

/**
 * 创建文本附件
 * @param id 附件ID
 * @param content 文本内容
 * @param filename 文件名（可选）
 * @param description 描述（可选）
 * @returns Attachment
 */
export const createTextAttachment = (
  id: string,
  content: string,
  filename?: string,
  description?: string,
): Attachment => ({
  type: 'Text',
  content: {
    id,
    description,
    filename,
    source: createBase64Source(
      btoa(unescape(encodeURIComponent(content))),
      'text/plain',
    ),
  },
});

/**
 * 创建图像附件
 * @param id 附件ID
 * @param imageData 图像数据（Base64 或文件路径）
 * @param mimeType MIME 类型
 * @param filename 文件名（可选）
 * @param description 描述（可选）
 * @param dimensions 图像尺寸（可选）
 * @returns Attachment
 */
export const createImageAttachment = (
  id: string,
  imageData: string,
  mimeType: string,
  filename?: string,
  description?: string,
  dimensions?: { width: number; height: number },
): Attachment => {
  const source =
    imageData.startsWith('data:') || imageData.startsWith('/')
      ? createFilePathSource(imageData)
      : createBase64Source(imageData, mimeType);

  return {
    type: 'Image',
    content: {
      id,
      description,
      filename,
      mime_type: mimeType,
      dimensions,
      source,
    },
  };
};

/**
 * 创建音频附件
 * @param id 附件ID
 * @param audioData 音频数据（Base64 或文件路径）
 * @param mimeType MIME 类型
 * @param filename 文件名（可选）
 * @param description 描述（可选）
 * @param duration 时长（秒，可选）
 * @returns Attachment
 */
export const createAudioAttachment = (
  id: string,
  audioData: string,
  mimeType: string,
  filename?: string,
  description?: string,
  duration?: number,
): Attachment => {
  const source =
    audioData.startsWith('data:') || audioData.startsWith('/')
      ? createFilePathSource(audioData)
      : createBase64Source(audioData, mimeType);

  return {
    type: 'Audio',
    content: {
      id,
      description,
      filename,
      mime_type: mimeType,
      duration,
      source,
    },
  };
};

/**
 * 创建文档附件
 * @param id 附件ID
 * @param documentData 文档数据（Base64 或文件路径）
 * @param mimeType MIME 类型
 * @param filename 文件名（可选）
 * @param description 描述（可选）
 * @param size 文件大小（字节，可选）
 * @returns Attachment
 */
export const createDocumentAttachment = (
  id: string,
  documentData: string,
  mimeType: string,
  filename?: string,
  description?: string,
  size?: number,
): Attachment => {
  const source =
    documentData.startsWith('data:') || documentData.startsWith('/')
      ? createFilePathSource(documentData)
      : createBase64Source(documentData, mimeType);

  return {
    type: 'Document',
    content: {
      id,
      description,
      filename,
      mime_type: mimeType,
      size,
      source,
    },
  };
};

/**
 * 验证附件数据
 * @param attachment 附件对象
 * @returns boolean
 */
export const validateAttachment = (attachment: Attachment): boolean => {
  try {
    const { type, content } = attachment;

    if (!type || !content) {
      return false;
    }

    const { id, source } = content;
    if (!id || !source) {
      return false;
    }

    const { source_type, data } = source;
    if (!source_type || !data) {
      return false;
    }

    // 根据源类型验证数据
    switch (source_type) {
      case 'FilePath':
        return !!data.path;
      case 'Base64':
        return !!(data.data && data.mime_type);
      case 'Url':
        return !!data.url;
      default:
        return false;
    }
  } catch (error) {
    console.error('附件验证失败:', error);
    return false;
  }
};

/**
 * 格式化数据源附件为 JSON 字符串数组
 * @param dataSources 数据源对象数组
 * @returns string[] JSON 字符串数组
 */
export const formatDataSourceAttachments = (dataSources: any[]): string[] => {
  return dataSources.map((source) => JSON.stringify(source));
};

/**
 * 解析数据源附件
 * @param jsonStrings JSON 字符串数组
 * @returns any[] 解析后的数据源对象数组
 */
export const parseDataSourceAttachments = (jsonStrings: string[]): any[] => {
  return jsonStrings
    .map((jsonString) => {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.error('数据源附件解析失败:', error);
        return null;
      }
    })
    .filter(Boolean);
};

/**
 * 生成唯一的附件ID
 * @param prefix 前缀
 * @returns string
 */
export const generateAttachmentId = (prefix: string = 'att'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 获取附件的 MIME 类型
 * @param filename 文件名
 * @returns string MIME 类型
 */
export const getMimeTypeFromFilename = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // 文本文件
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',

    // 图像文件
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',

    // 音频文件
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',

    // 视频文件
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    webm: 'video/webm',

    // 文档文件
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // 代码文件
    js: 'application/javascript',
    ts: 'application/typescript',
    html: 'text/html',
    css: 'text/css',
    py: 'text/x-python',
    java: 'text/x-java-source',
    cpp: 'text/x-c++src',
    c: 'text/x-csrc',
    go: 'text/x-go',
    rs: 'text/x-rust',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
};
