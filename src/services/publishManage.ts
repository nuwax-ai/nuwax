import type {
  PublishApplyListInfo,
  PublishListInfo,
} from '@/types/interfaces/publishManage';
import {
  PublishApplyListParams,
  PublishListParams,
} from '@/types/interfaces/publishManage';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 查询发布申请列表
export async function apiPublishApplyList(
  data: PublishApplyListParams,
): Promise<RequestResponse<Page<PublishApplyListInfo>>> {
  return request('/api/system/publish/apply/list', {
    method: 'POST',
    data,
  });
}

// 审核通过
export async function apiPassAudit(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/publish/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 审核拒绝
export async function apiRejectAudit(data: {
  id: number | undefined;
  reason: string;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/publish/reject/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 查询已发布管理列表
export async function apiPublishList(
  data: PublishListParams,
): Promise<RequestResponse<Page<PublishListInfo>>> {
  return request('/api/system/publish/list', {
    method: 'POST',
    data,
  });
}

// 下架
export async function apiOffShelf(data: {
  id: number | undefined;
  reason: string;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/publish/offShelf/${data.id}`, {
    method: 'POST',
    data,
  });
}
