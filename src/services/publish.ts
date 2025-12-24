import {
  PublishApplyParams,
  PublishItemInfo,
  PublishItemListParams,
  PublishOffShelfParams,
  PublishSkillTemplateCopyParams,
  PublishTemplateCopyParams,
} from '@/types/interfaces/publish';
import { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 智能体、工作流模板复制
export async function apiPublishTemplateCopy(
  data: PublishTemplateCopyParams,
): Promise<RequestResponse<number>> {
  return request('/api/publish/template/copy', {
    method: 'POST',
    data,
  });
}

// 技能模板复制
export async function apiPublishSkillTemplateCopy(
  data: PublishSkillTemplateCopyParams,
): Promise<RequestResponse<number>> {
  return request('/api/skill/copy', {
    method: 'POST',
    data,
  });
}

// 智能体、插件、工作流、技能下架
export async function apiPublishOffShelf(
  data: PublishOffShelfParams,
): Promise<RequestResponse<null>> {
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

// 智能体、插件、工作流等 - 提交发布申请
export async function apiPublishApply(
  data: PublishApplyParams,
): Promise<RequestResponse<string>> {
  return request('/api/publish/apply', {
    method: 'POST',
    data,
  });
}
