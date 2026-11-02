import { saveLocalFile } from '@/features/client-shell/localFileService';
import { apiTemplateExport } from '@/services/agentDev';
import { apiExportExcel } from '@/services/dataTable';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { message } from 'antd';
import { request } from 'umi';
import { saveWithDesktopHost } from './downloadCompletion';
import {
  getDownloadFileName,
  sanitizeDownloadBaseName,
} from './downloadFileName';
export { sanitizeDownloadBaseName } from './downloadFileName';

/**
 * 导出文件Blob返回类型
 */
export interface ExportFileBlobResponse {
  success: boolean;
  data?: Blob;
  headers?: {
    'content-disposition': string;
    'content-length': string;
    'content-type': string;
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

/** 兼容浏览器 Blob 与 Node/jsdom 测试中的 Blob polyfill */
const isBlobLike = (value: unknown): value is Blob =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as { text?: unknown }).text === 'function';

/**
 * 处理 blob 响应，检测并解析错误信息
 * @param response 请求响应对象
 * @param defaultErrorMessage 默认错误消息
 * @returns 处理后的响应结果
 */
async function handleBlobResponse(
  response: any,
  defaultErrorMessage: string = dict('PC.Utils.ExportImport.exportFailed'),
): Promise<ExportFileBlobResponse> {
  const { data, headers } = response;
  const contentType = headers?.['content-type'] || '';

  // 检查响应是否为JSON错误（通常错误响应的content-type是application/json）
  if (
    contentType.includes('application/json') ||
    contentType.includes('text/json')
  ) {
    // 尝试将Blob转换为文本并解析为JSON
    try {
      const text = isBlobLike(data)
        ? await data.text()
        : typeof data === 'string'
        ? data
        : '';
      const errorData = JSON.parse(text);

      // 如果解析成功且包含错误信息，返回错误
      // success 缺省时也按业务失败处理（如 code=0001 + message）
      if (errorData && errorData.success !== true) {
        return {
          success: false,
          error: {
            code: errorData.code || '',
            displayCode: errorData.displayCode || '',
            message: errorData.message || defaultErrorMessage,
            data: errorData.data || null,
            success: errorData.success === true,
            tid: errorData.tid || '',
          },
        };
      }
    } catch (parseError) {
      // 如果解析失败，返回通用错误
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

  // 成功返回文件数据
  return {
    success: true,
    data: data as Blob,
    headers: headers as {
      'content-disposition': string;
      'content-length': string;
      'content-type': string;
    },
  };
}

/**
 * 处理导出请求的错误
 * @param error 错误对象
 * @returns 错误响应结果
 */
function handleExportError(error: any): ExportFileBlobResponse {
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
 * HTTP 非 2xx 时 umi/axios 会 reject；responseType=blob 时业务 JSON 在
 * error.response.data（Blob）里，不能只读 error.message（常为 status 文案）。
 */
async function handleExportRequestError(
  error: any,
): Promise<ExportFileBlobResponse> {
  const responseData = error?.response?.data;
  if (isBlobLike(responseData)) {
    const headers = error?.response?.headers || {};
    const contentType =
      headers['content-type'] ||
      headers['Content-Type'] ||
      responseData.type ||
      '';
    // 400 等错误体常是 JSON；content-type 偶发缺失时仍按 JSON 业务错误试解析
    return await handleBlobResponse({
      data: responseData,
      headers: {
        ...headers,
        'content-type': contentType || 'application/json',
      },
    });
  }
  if (
    responseData &&
    typeof responseData === 'object' &&
    (typeof responseData.message === 'string' || responseData.success === false)
  ) {
    return {
      success: false,
      error: {
        code: responseData.code || '',
        displayCode: responseData.displayCode || '',
        message:
          responseData.message || dict('PC.Utils.ExportImport.exportFailed'),
        data: responseData.data || null,
        success: false,
        tid: responseData.tid || '',
      },
    };
  }
  return handleExportError(error);
}

// 导出文件Blob,然后直接下载为.zip文件，将后台接口返回的错误信息返回，便于前端显示错误信息
export async function apiExportFileBlob(
  url: string,
): Promise<ExportFileBlobResponse> {
  try {
    const response = await request(url, {
      method: 'GET',
      responseType: 'blob', // 指定响应类型为blob
      getResponse: true, // 获取完整响应对象
      skipErrorHandler: true, // 跳过全局错误处理，手动处理错误
    });

    return await handleBlobResponse(response);
  } catch (error: any) {
    return handleExportRequestError(error);
  }
}

/**
 * 模板导出配置文件，支持Agent、Workflow、Plugin、Table
 * @param targetId 目标ID
 * @param targetType 目标类型
 * @param fileName 文件名称
 */
export const exportConfigFile = async (
  id: number,
  type: AgentComponentTypeEnum = AgentComponentTypeEnum.Agent,
) => {
  try {
    const res = await apiTemplateExport(id, type);

    // 判断是否成功
    if (!res.success) {
      // 导出失败，显示错误信息
      const errorMessage =
        res.error?.message || dict('PC.Utils.ExportImport.exportFailed');
      message.warning(errorMessage);
      return;
    }

    // 从响应头中获取文件名
    const contentDisposition = res.headers?.['content-disposition'];
    const fileName = getDownloadFileName(
      contentDisposition,
      `config-${id}.zip`,
    );

    // 当使用 getResponse: true 时，_res 是一个包含 data 属性的响应对象
    const blob = new Blob([res?.data || '']); // 将响应数据转换为 Blob 对象
    const objectURL = URL.createObjectURL(blob); // 创建一个 URL 对象
    const link = document.createElement('a'); // 创建一个 a 标签
    link.href = objectURL;
    link.download = fileName; // 设置下载文件的名称
    link.click(); // 模拟点击下载
    URL.revokeObjectURL(objectURL); // 释放 URL 对象
  } finally {
  }
};

/**
 * 构建导出 zip 的默认文件名（NW-273）：带上资源名称，避免保存弹窗回落到泛名 export.zip。
 * 复用安全基础名规则；为空时返回 undefined，让调用链回落原默认名。
 */
export const buildExportZipName = (
  rawName?: string | null,
): string | undefined => {
  const cleaned = sanitizeDownloadBaseName(rawName ?? '');
  return cleaned ? `${cleaned}.zip` : undefined;
};

async function downloadExportFile(
  linkUrl: string,
  fileName?: string,
  preserveBrowserName = false,
) {
  const localSaved = await saveLocalFile(linkUrl, fileName);
  if (localSaved !== undefined) return localSaved;
  const saved = await saveWithDesktopHost(linkUrl, fileName || 'export.zip');
  if (saved !== undefined) return saved;

  let objectUrl: string | undefined;
  if (preserveBrowserName && fileName) {
    // 服务端 Content-Disposition 会覆盖 a.download。命名导出先通过统一请求层
    // 读取归档，再下载 Blob，才能保留资源名称并识别 JSON 业务失败。
    const result = await apiExportFileBlob(linkUrl);
    if (!result.success || !result.data) {
      throw new Error(
        result.error?.message || dict('PC.Utils.ExportImport.exportFailed'),
      );
    }
    objectUrl = window.URL.createObjectURL(result.data);
  }

  // 浏览器只能确认触发，不能据此提示文件保存成功。
  const link = document.createElement('a');
  link.href = objectUrl || linkUrl;
  link.style.display = 'none';
  link.target = '_blank';
  link.download = fileName || '';
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    if (objectUrl) {
      // 等下载导航接管 Blob 后释放，避免同步撤销使浏览器取消下载。
      const urlToRevoke = objectUrl;
      window.setTimeout(() => window.URL.revokeObjectURL(urlToRevoke), 0);
    }
  }
  return false;
}

/** 普通文件下载保留原链接及响应头语义；资源归档使用 exportNamedDownload。 */
export const exportFileViaBrowserDownload = (
  linkUrl: string,
  fileName?: string,
) => downloadExportFile(linkUrl, fileName);

/** 命名只影响默认文件名；保存成功、取消和失败仍由原下载链路确认。 */
export const exportNamedDownload = async (
  linkUrl: string,
  resourceName?: string,
  ext = 'zip',
) => {
  const base = sanitizeDownloadBaseName(resourceName || '');
  return downloadExportFile(linkUrl, base ? `${base}.${ext}` : undefined, true);
};

/**
 * 导出业务表数据为Excel
 * @param tableId 业务表ID
 * @param fileName 文件名称
 */
export const exportTableExcel = async (tableId: number, fileName: string) => {
  try {
    const res = await apiExportExcel(tableId);
    // 判断是否成功
    if (!res.success) {
      // 导出失败，显示错误信息
      const errorMessage =
        res.error?.message || dict('PC.Utils.ExportImport.exportFailed');
      message.warning(errorMessage);
      return;
    }

    // 当使用 getResponse: true 时，_res 是一个包含 data 属性的响应对象
    const blob = new Blob([res.data || ''], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }); // 将响应数据转换为 Blob 对象
    const objectURL = URL.createObjectURL(blob); // 创建一个 URL 对象
    const link = document.createElement('a'); // 创建一个 a 标签
    link.href = objectURL;
    link.download = `${fileName}.xlsx`; // 设置下载文件的名称
    link.click(); // 模拟点击下载
    URL.revokeObjectURL(objectURL); // 释放 URL 对象
  } finally {
  }
};

/**
 * 导出整个项目压缩包
 * @param result 下载接口响应结果
 * @param name 文件名称
 */
export const exportWholeProjectZip = async (result: any, name: string) => {
  // 从响应头中获取文件名
  const contentDisposition = result.headers?.['content-disposition'];
  let filename = name;

  if (contentDisposition) {
    // 解析 Content-Disposition 头中的文件名
    const filenameMatch = contentDisposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
    );

    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');

      // 解码文件名
      if (filename) {
        filename = decodeURIComponent(filename);
      }
    }
  }

  // 创建下载链接
  const blob = new Blob([result.data], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // 触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 清理URL对象
  window.URL.revokeObjectURL(url);
};
