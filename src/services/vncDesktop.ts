import { RequestResponse } from '@/types/interfaces/request';
import type {
  ISkillUploadFileParams,
  IUpdateStaticFileParams,
  StaticFileListResponse,
} from '@/types/interfaces/vncDesktop';
import { request } from 'umi';

// 查询文件列表
export async function apiGetStaticFileList(
  cId: number,
): Promise<RequestResponse<StaticFileListResponse>> {
  return request('/api/computer/static/file-list', {
    method: 'GET',
    params: {
      cId,
    },
  });
}

// 静态文件访问
export async function apiGetStaticFileDetail(
  cId: number,
): Promise<RequestResponse<any>> {
  return request(`/api/computer/static/${cId}/**`, {
    method: 'GET',
  });
}

// 文件修改
export async function apiUpdateStaticFile(
  data: IUpdateStaticFileParams,
): Promise<RequestResponse<null>> {
  return request('/api/computer/static/files-update', {
    method: 'POST',
    data,
  });
}

// 上传技能文件
export async function apiSkillUploadFile(
  params: ISkillUploadFileParams,
): Promise<RequestResponse<null>> {
  const { file, cId, filePath } = params;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cId', cId.toString());
  formData.append('filePath', filePath);

  return request('/api/computer/static/upload-file', {
    method: 'POST',
    data: formData,
  });
}
