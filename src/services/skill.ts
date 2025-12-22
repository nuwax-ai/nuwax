import { HistoryData } from '@/types/interfaces/publish';
import { Page, RequestResponse } from '@/types/interfaces/request';
import {
  PublishedSkillListParams,
  SkillDetailInfo,
  SkillImportParams,
  SkillUpdateParams,
  SkillUploadFileParams,
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

// 上传技能文件
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

/**
 * 从URL获取内容（通用方法）
 * 支持相对路径和完整URL，自动判断使用哪种方式获取
 * @param url URL地址（可以是相对路径或完整URL）
 * @returns Promise<string> 返回URL的内容文本
 * @throws 如果请求失败会抛出错误
 */
// export async function fetchContentFromUrl(url: string): Promise<string> {
//   // 如果是相对路径（以 / 开头），使用 apiUrl
//   if (url.startsWith('/')) {
//     const res = await apiUrl(url);
//     if (res.success && res.data) {
//       return res.data;
//     } else {
//       throw new Error(res.message || '获取内容失败');
//     }
//   }

//   // 如果是完整URL，判断是否为同源
//   const baseUrl = process.env.BASE_URL || '';
//   const isSameOrigin = url.startsWith(baseUrl);

//   if (isSameOrigin) {
//     // 同源URL，提取相对路径部分
//     const relativePath = url.replace(baseUrl, '');
//     const res = await apiUrl(relativePath);
//     if (res.success && res.data) {
//       return res.data;
//     } else {
//       throw new Error(res.message || '获取内容失败');
//     }
//   } else {
//     // 跨域URL，使用原生 fetch（需要后端支持CORS或使用代理）
//     // 注意：如果跨域URL需要认证，可能需要通过后端代理
//     try {
//       const response = await fetch(url);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       return await response.text();
//     } catch (error) {
//       // 如果直接fetch失败，尝试通过后端代理
//       // 假设后端有代理接口：/api/proxy?url=xxx
//       const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
//       const res = await apiUrl(proxyUrl);
//       if (res.success && res.data) {
//         return res.data;
//       } else {
//         throw new Error(
//           `无法获取URL内容: ${error instanceof Error ? error.message : '未知错误'}`
//         );
//       }
//     }
//   }
// }
