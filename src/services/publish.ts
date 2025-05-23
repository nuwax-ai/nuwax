import {
  PublishApplyParams,
  PublishItemInfo,
  PublishItemListParams,
  PublishOffShelfParams,
} from '@/types/interfaces/publish';
import { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 智能体、插件、工作流下架
export async function apiPublishOffShelf(
  data: PublishOffShelfParams,
): Promise<RequestResponse<number>> {
  return request('/api/publish/offShelf', {
    method: 'POST',
    data,
  });
}

// 查询指定智能体插件或工作流已发布列表
export async function apiPublishItemList(
  data: PublishItemListParams,
): Promise<RequestResponse<PublishItemInfo[]>> {
  return request('/api/publish/item/list', {
    method: 'POST',
    data,
  });
}

// 提交发布申请
export async function apiPublishApply(
  data: PublishApplyParams,
): Promise<RequestResponse<number>> {
  return request('/api/publish/apply', {
    method: 'POST',
    data,
  });
}
