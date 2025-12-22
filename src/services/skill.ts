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
  formData.append('targetSkillId', targetSkillId);
  formData.append('targetSpaceId', targetSpaceId);

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
export async function apiSkillExport(skillId: number): Promise<{
  data: Blob;
  headers: {
    'content-disposition': string;
    'content-length': string;
    'content-type': string;
  };
}> {
  return request(`/api/skill/export/${skillId}`, {
    method: 'GET',
    responseType: 'blob', // 指定响应类型为blob
    getResponse: true, // 获取完整响应对象
  });
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
export async function fetchContentFromUrl(
  url: string,
): Promise<RequestResponse<string>> {
  return request(url, {
    method: 'GET',
  });
}
