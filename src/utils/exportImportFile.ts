import { apiTemplateExport } from '@/services/agentDev';
import { apiExportExcel } from '@/services/dataTable';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { message } from 'antd';
import { request } from 'umi';

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

/**
 * 处理 blob 响应，检测并解析错误信息
 * @param response 请求响应对象
 * @param defaultErrorMessage 默认错误消息
 * @returns 处理后的响应结果
 */
async function handleBlobResponse(
  response: any,
  defaultErrorMessage: string = '导出失败',
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
      const text = await (data as Blob).text();
      const errorData = JSON.parse(text);

      // 如果解析成功且包含错误信息，返回错误
      if (errorData && !errorData.success) {
        return {
          success: false,
          error: {
            code: errorData.code || '',
            displayCode: errorData.displayCode || '',
            message: errorData.message || defaultErrorMessage,
            data: errorData.data || null,
            success: errorData.success || false,
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
          message: '无法解析服务器响应',
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
      message: error?.info?.message || error?.message || '网络请求失败',
      data: null,
      success: false,
      tid: error?.info?.tid || '',
    },
  };
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
    return handleExportError(error);
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
      const errorMessage = res.error?.message || '导出失败';
      message.warning(errorMessage);
      return;
    }

    // 从响应头中获取文件名
    const contentDisposition = res.headers?.['content-disposition'];
    // 解码文件名
    const fileName = decodeURIComponent(
      contentDisposition?.split('filename=')[1].replace(/"/g, '') || '',
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
      const errorMessage = res.error?.message || '导出失败';
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
