import {
  CreateCustomPageInfo,
  CustomPageCreateParams,
  CustomPageDto,
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
  data: CustomPageCreateParams,
): Promise<RequestResponse<CreateCustomPageInfo>> {
  return request('/api/custom-page/create', {
    method: 'POST',
    data,
  });
}

// 分页查询前端页面项目
export async function apiCustomPageQueryList(
  spaceId: number,
): Promise<RequestResponse<CustomPageDto>> {
  return request('/api/custom-page/list-projects', {
    method: 'GET',
    params: {
      spaceId,
    },
  });
}
