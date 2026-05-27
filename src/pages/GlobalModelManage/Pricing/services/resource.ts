import {
  ModelPricingInfo,
  ResourcePricingConfigInfo,
  ToolPricingInfo,
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
 * 模型-删除定价配置
 */
export async function apiSystemDeleteModelPricingConfig(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/pricing/config/${id}/delete`, {
    method: 'POST',
  });
}

/**
 * 资源-创建或更新定价配置
 */
export async function apiSystemModelPricingConfigSave(
  data: ToolPricingInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/pricing/config/save', {
    method: 'POST',
    data,
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
