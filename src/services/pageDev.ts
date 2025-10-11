import type { BuildRunningEnum } from '@/types/enums/pageDev';
import type {
  CreateCustomPageInfo,
  CustomPageBindDevAgentParams,
  CustomPageDto,
  PageAddPathParams,
  PageBatchConfigProxyParams,
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

// 分页查询前端页面项目
export async function apiCustomPageQueryList(
  spaceId: number,
  buildRunning?: BuildRunningEnum,
): Promise<RequestResponse<CustomPageDto>> {
  return request('/api/custom-page/list-projects', {
    method: 'GET',
    params: {
      spaceId,
      buildRunning,
    },
  });
}

// 绑定开发智能体
export async function apiCustomPageBindDevAgent(
  data: CustomPageBindDevAgentParams,
): Promise<RequestResponse<null>> {
  return request('/api/custom-page/bind-dev-agent', {
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
