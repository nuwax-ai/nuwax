import {
  ModelPricingInfo,
  ResourcePricingConfigInfo,
} from '@/pages/SpaceResource/types/resource';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// ======================= 模型定价 =======================
/**
 * 模型-删除价格档位
 */
export async function apiSystemDeleteModelPricing(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/pricing/model-tier/${id}/delete`, {
    method: 'POST',
  });
}

/**
 * 模型-修改价格档位
 */
export async function apiSystemUpdateModelPricing(
  data: ModelPricingInfo,
): Promise<RequestResponse<ModelPricingInfo>> {
  return request('/api/system/pricing/model-tier/update', {
    method: 'POST',
    data,
  });
}

/**
 * 模型-新增价格档位
 */
export async function apiSystemCreateModelPricing(
  data: ModelPricingInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/pricing/model-tier/add', {
    method: 'POST',
    data,
  });
}

/**
 * 模型-查询定价配置列表
 */
export async function apiSystemListPricingConfig(): Promise<
  RequestResponse<ResourcePricingConfigInfo[]>
> {
  return request('/api/system/pricing/model/config/list', {
    method: 'GET',
  });
}

/**
 * 模型-查询价格档位列表
 */
export async function apiSystemListModelPricing(
  modelId: number,
): Promise<RequestResponse<ModelPricingInfo[]>> {
  return request('/api/system/pricing/model-tier/list', {
    method: 'GET',
    params: {
      modelId,
    },
  });
}
