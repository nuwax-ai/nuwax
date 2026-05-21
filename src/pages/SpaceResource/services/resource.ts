import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import {
  ListPricingConfigsParams,
  ModelPricingInfo,
  QueryPricingInfoParams,
  ResourcePricingConfigInfo,
  ToolPricingInfo,
} from '../types/resource';

// ======================= 模型定价 =======================
/**
 * 模型-删除价格档位
 */
export async function apiDeleteModelPricing(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/pricing/model-tier/${id}/delete`, {
    method: 'POST',
  });
}

/**
 * 模型-修改价格档位
 */
export async function apiUpdateModelPricing(
  data: ModelPricingInfo,
): Promise<RequestResponse<ModelPricingInfo>> {
  return request('/api/pricing/model-tier/update', {
    method: 'POST',
    data,
  });
}

/**
 * 模型-新增价格档位
 */
export async function apiCreateModelPricing(
  data: ModelPricingInfo,
): Promise<RequestResponse<null>> {
  return request('/api/pricing/model-tier/add', {
    method: 'POST',
    data,
  });
}

/**
 * 模型-查询价格档位列表
 */
export async function apiListModelPricing(
  modelId: number,
): Promise<RequestResponse<ModelPricingInfo[]>> {
  return request('/api/pricing/model-tier/list', {
    method: 'GET',
    params: {
      modelId,
    },
  });
}

// ======================= 工具定价 =======================

/**
 * 资源-创建或更新定价配置
 */
export async function apiUpdateToolPricing(
  data: ToolPricingInfo,
): Promise<RequestResponse<null>> {
  return request('/api/pricing/config/save', {
    method: 'POST',
    data,
  });
}

/**
 * 资源-查询目标对象定价配置
 */
export async function apiQueryToolPricing(
  data: QueryPricingInfoParams,
): Promise<RequestResponse<ResourcePricingConfigInfo>> {
  return request('/api/pricing/config/query', {
    method: 'POST',
    data,
  });
}

/**
 * 资源-查询定价配置列表
 */
export async function apiListPricingConfig(
  data: ListPricingConfigsParams,
): Promise<RequestResponse<ResourcePricingConfigInfo[]>> {
  return request('/api/pricing/config/list', {
    method: 'POST',
    data,
  });
}

/**
 * 资源-删除定价配置
 */
export async function apiDeleteToolPricing(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/pricing/config/${id}/delete`, {
    method: 'POST',
  });
}
