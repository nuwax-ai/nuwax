import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  SensitiveWordCreateParams,
  SensitiveWordInfo,
  SensitiveWordPageParams,
  SensitiveWordUpdateParams,
} from '@/types/interfaces/sensitiveWord';
import { request } from 'umi';

// 分页查询敏感词
export async function apiSensitiveWordPage(
  data: SensitiveWordPageParams,
): Promise<RequestResponse<Page<SensitiveWordInfo>>> {
  return request('/api/system/sensitive/word/page', {
    method: 'POST',
    data,
  });
}

// 新增敏感词
export async function apiSensitiveWordCreate(
  data: SensitiveWordCreateParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/sensitive/word/create', {
    method: 'POST',
    data,
  });
}

// 编辑敏感词
export async function apiSensitiveWordUpdate(
  data: SensitiveWordUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/sensitive/word/update', {
    method: 'POST',
    data,
  });
}

// 启用/禁用敏感词
export async function apiSensitiveWordUpdateStatus(data: {
  id: number;
  status: number;
}): Promise<RequestResponse<null>> {
  return request('/api/system/sensitive/word/updateStatus', {
    method: 'POST',
    data,
  });
}

// 删除敏感词
export async function apiSensitiveWordDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/sensitive/word/delete/${id}`, {
    method: 'POST',
  });
}
