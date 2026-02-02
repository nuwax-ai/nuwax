import { HistoryData } from '@/types/interfaces/publish';
import { Page, RequestResponse } from '@/types/interfaces/request';
import {
  PublishedSkillListParams,
  SkillDetailInfo,
  SkillImportParams,
  SkillUpdateParams,
  SkillUploadFileParams,
  SkillUploadFilesParams,
} from '@/types/interfaces/skill';
import { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { request } from 'umi';

/**
 * 导出接口返回类型
 */
export interface SkillExportResponse {
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
): Promise<SkillExportResponse> {
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
function handleExportError(error: any): SkillExportResponse {
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

// 查询技能详情
export async function apiSkillDetail(
  skillId: number,
): Promise<RequestResponse<SkillDetailInfo>> {
  return request(`/api/skill/${skillId}`, {
    method: 'GET',
  });
}

// 查询技能模板
export async function apiSkillTemplate(): Promise<
  RequestResponse<SkillDetailInfo>
> {
  return request('/api/skill/template', {
    method: 'GET',
  });
}

// 修改技能
export async function apiSkillUpdate(
  data: SkillUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/skill/update', {
    method: 'POST',
    data,
  });
}

// 导入技能
export async function apiSkillImport(
  params: SkillImportParams,
): Promise<RequestResponse<number>> {
  const { file, targetSkillId, targetSpaceId } = params;
  const formData = new FormData();
  formData.append('file', file);
  if (targetSkillId) {
    formData.append('targetSkillId', targetSkillId.toString());
  }
  if (targetSpaceId) {
    formData.append('targetSpaceId', targetSpaceId.toString());
  }

  return request('/api/skill/import', {
    method: 'POST',
    data: formData,
  });
}

// 上传文件到技能
export async function apiSkillUploadFile(
  params: SkillUploadFileParams,
): Promise<RequestResponse<number>> {
  const { file, skillId, filePath } = params;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('skillId', skillId.toString());
  formData.append('filePath', filePath);

  return request('/api/skill/upload-file', {
    method: 'POST',
    data: formData,
  });
}

// 批量上传文件到技能
export async function apiSkillUploadFiles(
  params: SkillUploadFilesParams,
): Promise<RequestResponse<number>> {
  const { files, skillId, filePaths } = params;
  const formData = new FormData();

  // 批量上传文件：将每个文件 append 到 FormData
  // 注意：多个文件使用相同的 key 'files'，后端会以数组形式接收
  files.forEach((file) => {
    formData.append('files', file);
  });

  // 添加技能ID
  formData.append('skillId', skillId.toString());

  // 批量添加文件路径：将每个路径 append 到 FormData
  // 注意：多个路径使用相同的 key 'filePaths'，后端会以数组形式接收
  filePaths.forEach((filePath) => {
    formData.append('filePaths', filePath);
  });

  return request('/api/skill/upload-files', {
    method: 'POST',
    data: formData,
  });
}

// 导出技能
export async function apiSkillExport(
  skillId: number,
): Promise<SkillExportResponse> {
  try {
    const response = await request(`/api/skill/export/${skillId}`, {
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

// 广场技能下载导出
export async function apiSkillExportSquare(
  skillId: number,
): Promise<SkillExportResponse> {
  try {
    const response = await request(`/api/published/skill/export/${skillId}`, {
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

// 已发布技能列表接口
export async function apiPublishedSkillList(
  data: PublishedSkillListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/skill/list', {
    method: 'POST',
    data,
  });
}

// 查询技能历史配置信息接口
export async function apiSkillConfigHistoryList(
  skillId: number,
): Promise<RequestResponse<HistoryData[]>> {
  return request(`/api/skill/config/history/list/${skillId}`, {
    method: 'GET',
  });
}

/**
 * 查询指定URL接口
 * 用于获取相对路径的URL内容（会自动添加BASE_URL前缀）
 * @param url 相对路径URL，如 '/api/computer/static/1461016/今日新闻PPT报告.md'
 * @returns Promise<RequestResponse<string>> 返回URL的内容
 */
export async function fetchContentFromUrl(url: string): Promise<string> {
  return request(url, {
    method: 'GET',
  });
}
