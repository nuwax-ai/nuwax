import { ACCESS_TOKEN } from '@/constants/home.constants';
import { HistoryData } from '@/types/interfaces/publish';
import { RequestResponse } from '@/types/interfaces/request';
import {
  SkillDetailInfo,
  SkillImportParams,
  SkillUpdateParams,
  SkillUploadFileParams,
  SkillUploadFilesParams,
} from '@/types/interfaces/skill';
import {
  apiExportFileBlob,
  ExportFileBlobResponse,
} from '@/utils/exportImportFile';
import { request } from 'umi';

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
): Promise<ExportFileBlobResponse> {
  return apiExportFileBlob(`/api/skill/export/${skillId}`);
}

// 广场技能下载导出
export async function apiSkillExportSquare(
  skillId: number,
): Promise<ExportFileBlobResponse> {
  return apiExportFileBlob(`/api/published/skill/export/${skillId}`);
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
 * @param url Relative URL, e.g. '/api/computer/static/1461016/daily-news-report.md'
 * @returns Promise<RequestResponse<string>> 返回URL的内容
 */
export async function fetchContentFromUrl(url: string): Promise<string> {
  try {
    const fullUrl = `${process.env.BASE_URL || ''}${url}`;
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'text/plain, application/json, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file content: ${response.status}`);
    }

    // 关键：直接读取文本，避免自动 JSON 解析把超长数字转成 number
    return response.text();
  } catch (error) {
    console.error('Failed to get file content: ', error);
    throw error;
  }
}
