/**
 * 多语言配置导出：POST 接收 JSON 文件流（Blob），与 exportImportFile 内逻辑独立，避免改动通用导出工具。
 */
import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import { request } from 'umi';

/** 与通用导出结构一致，仅供本模块与 i18n 导出接口使用 */
export interface I18nConfigExportBlobResult {
  success: boolean;
  data?: Blob;
  headers?: {
    'content-disposition'?: string;
    'content-length'?: string;
    'content-type'?: string;
  };
  error?: {
    code: string;
    displayCode: string;
    message: string;
    data: null;
    success: boolean;
    tid: string;
  };
}

async function parseI18nExportBlobResponse(
  response: any,
  defaultErrorMessage: string = dict('PC.Utils.ExportImport.exportFailed'),
): Promise<I18nConfigExportBlobResult> {
  const { data, headers } = response;
  const contentDisposition = String(headers?.['content-disposition'] || '');
  if (/attachment/i.test(contentDisposition)) {
    return {
      success: true,
      data: data as Blob,
      headers,
    };
  }

  const contentType = headers?.['content-type'] || '';
  if (
    contentType.includes('application/json') ||
    contentType.includes('text/json')
  ) {
    try {
      const text = await (data as Blob).text();
      const errorData = JSON.parse(text);
      if (errorData && !errorData.success) {
        return {
          success: false,
          error: {
            code: errorData.code || '',
            displayCode: errorData.displayCode || '',
            message: errorData.message || defaultErrorMessage,
            data: errorData.data ?? null,
            success: errorData.success || false,
            tid: errorData.tid || '',
          },
        };
      }
    } catch {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          displayCode: 'PARSE_ERROR',
          message: dict('PC.Utils.ExportImport.cannotParseResponse'),
          data: null,
          success: false,
          tid: '',
        },
      };
    }
  }

  return {
    success: true,
    data: data as Blob,
    headers,
  };
}

function wrapI18nExportRequestError(error: any): I18nConfigExportBlobResult {
  return {
    success: false,
    error: {
      code: error?.info?.code || 'NETWORK_ERROR',
      displayCode: error?.info?.displayCode || 'NETWORK_ERROR',
      message:
        error?.info?.message ||
        error?.message ||
        dict('PC.Utils.ExportImport.networkRequestFailed'),
      data: null,
      success: false,
      tid: error?.info?.tid || '',
    },
  };
}

/**
 * POST 导出多语言配置，响应为 Blob
 */
export async function requestI18nConfigExportPostBlob(
  url: string,
  body?: unknown,
): Promise<I18nConfigExportBlobResult> {
  try {
    const response = await request(url, {
      method: 'POST',
      data: body,
      responseType: 'blob',
      getResponse: true,
      skipErrorHandler: true,
    });
    return await parseI18nExportBlobResponse(response);
  } catch (error: any) {
    return wrapI18nExportRequestError(error);
  }
}

/**
 * 根据导出接口结果触发浏览器下载（JSON 文件流）
 */
export function downloadI18nConfigExportBlob(
  res: I18nConfigExportBlobResult,
  fallbackFileName?: string,
): void {
  if (!res.success) {
    message.warning(
      res.error?.message || dict('PC.Utils.ExportImport.exportFailed'),
    );
    return;
  }

  const cd = res.headers?.['content-disposition'] || '';
  const fromHeader = cd.split('filename=')[1]?.replace(/"/g, '');
  const fileName =
    (fromHeader && decodeURIComponent(fromHeader)) || fallbackFileName || '';

  const blob = new Blob([res.data || ''], {
    type: res.headers?.['content-type'] || 'application/json',
  });
  const objectURL = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectURL;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectURL);
}
