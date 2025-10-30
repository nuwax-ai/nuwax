import type {
  CreateCustomPageInfo,
  CustomPageDto,
  PageAddPathParams,
  PageBatchConfigProxyParams,
  PageCopyParams,
  PageCopyProjectInfo,
  PageDeletePathParams,
  PageQueryListParams,
  PageUpdateParams,
  PageUploadAndStartParams,
} from '@/types/interfaces/pageDev';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 上传前端项目压缩包并启动开发服务器
export async function apiCustomPageUploadAndStart(
  data: PageUploadAndStartParams,
): Promise<RequestResponse<CreateCustomPageInfo>> {
  return request('/api/custom-page/upload-and-start', {
    method: 'POST',
    data,
  });
}

// 创建用户前端页面项目
export async function apiCustomPageCreate(
  data: PageUploadAndStartParams,
): Promise<RequestResponse<CreateCustomPageInfo>> {
  return request('/api/custom-page/create', {
    method: 'POST',
    data,
  });
}

// 创建反向代理项目
export async function apiCustomPageCreateReverseProxy(
  data: PageUploadAndStartParams,
): Promise<RequestResponse<CreateCustomPageInfo>> {
  return request('/api/custom-page/create-reverse-proxy', {
    method: 'POST',
    data,
  });
}

// 查询前端页面列表
export async function apiCustomPageQueryList(
  data: PageQueryListParams,
): Promise<RequestResponse<CustomPageDto>> {
  return request('/api/custom-page/list-projects', {
    method: 'GET',
    params: data,
  });
}

// 复制项目
export async function apiCustomPageCopyProject(
  data: PageCopyParams,
): Promise<RequestResponse<PageCopyProjectInfo>> {
  return request('/api/custom-page/copy-project', {
    method: 'POST',
    data,
  });
}

// 配置反向代理
export async function apiPageBatchConfigProxy(
  data: PageBatchConfigProxyParams,
): Promise<RequestResponse<null>> {
  return request('/api/custom-page/batch-config-proxy', {
    method: 'POST',
    data,
  });
}

// 添加路径配置
export async function apiPageAddPath(
  data: PageAddPathParams,
): Promise<RequestResponse<null>> {
  return request('/api/custom-page/add-path', {
    method: 'POST',
    data,
  });
}

// 编辑路径配置
export async function apiPageUpdatePath(
  data: PageAddPathParams,
): Promise<RequestResponse<null>> {
  return request('/api/custom-page/edit-path', {
    method: 'POST',
    data,
  });
}

// 删除路径配置
export async function apiPageDeletePath(
  data: PageDeletePathParams,
): Promise<RequestResponse<null>> {
  return request('/api/custom-page/delete-path', {
    method: 'POST',
    data,
  });
}

// 保存路径参数
export async function apiPageSavePathArgs(
  data: PageAddPathParams,
): Promise<RequestResponse<null>> {
  return request('/api/custom-page/save-path-args', {
    method: 'POST',
    data,
  });
}

// 查询项目详情
export async function apiPageGetProjectInfo(
  projectId: string,
): Promise<RequestResponse<CustomPageDto>> {
  return request('/api/custom-page/get-project-info', {
    method: 'GET',
    params: {
      projectId,
    },
  });
}

// 删除页面项目
export async function apiPageDeleteProject(
  projectId: number,
): Promise<RequestResponse<null>> {
  return request('/api/custom-page/delete-project', {
    method: 'POST',
    data: { projectId },
  });
}

// 修改项目
export async function apiPageUpdateProject(
  data: PageUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/custom-page/update-project', {
    method: 'POST',
    data,
  });
}
