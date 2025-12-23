import { RequestResponse } from '@/types/interfaces/request';
import type {
  ISkillUploadFileParams,
  IUpdateStaticFileParams,
  IUploadFilesParams,
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
export async function apiUploadFile(
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

// 批量文件上传
export async function apiUploadFiles(
  params: IUploadFilesParams,
): Promise<RequestResponse<number>> {
  const { files, cId, filePaths } = params;
  const formData = new FormData();

  // 批量上传文件：将每个文件 append 到 FormData
  // 注意：多个文件使用相同的 key 'files'，后端会以数组形式接收
  files.forEach((file) => {
    formData.append('files', file);
  });

  // 添加技能ID
  formData.append('cId', cId.toString());

  // 批量添加文件路径：将每个路径 append 到 FormData
  // 注意：多个路径使用相同的 key 'filePaths'，后端会以数组形式接收
  filePaths.forEach((filePath) => {
    formData.append('filePaths', filePath);
  });

  return request('/api/computer/static/upload-files', {
    method: 'POST',
    data: formData,
  });
}

// 下载全部文件
export async function apiDownloadAllFiles(cId: number): Promise<{
  data: Blob;
  headers: {
    'content-disposition': string;
    'content-length': string;
    'content-type': string;
  };
}> {
  return request(`/api/computer/static/download-all-files`, {
    method: 'GET',
    responseType: 'blob', // 指定响应类型为blob
    getResponse: true, // 获取完整响应对象
    params: {
      cId,
    },
  });
}

// 启动容器
export async function apiEnsurePod(
  cId: number,
): Promise<RequestResponse<null>> {
  return request('/api/computer/pod/ensure', {
    method: 'POST',
    params: {
      cId,
    },
  });
}

// 重启容器(销毁后重建)
export async function apiRestartPod(
  cId: number,
): Promise<RequestResponse<null>> {
  return request('/api/computer/pod/restart', {
    method: 'POST',
    params: {
      cId,
    },
  });
}

// 容器保活
export async function apiKeepalivePod(
  cId: number,
): Promise<RequestResponse<null>> {
  return request('/api/computer/pod/keepalive', {
    method: 'POST',
    params: {
      cId,
    },
  });
}
