import type { RequestResponse } from '@/types/interfaces/request';
import type { SkillPricingInfo } from '@/types/interfaces/subscription';
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

/**
 * 切换工具定价状态
 */
export async function apiToggleToolPricing(
  id: number,
  enabled: boolean,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/tools/${id}/toggle`, {
    method: 'PUT',
    data: { enabled },
  });
}

/**
 * 查询技能定价列表
 */
export async function apiListSkillPricing(
  spaceId: number,
): Promise<RequestResponse<SkillPricingInfo[]>> {
  return request(`/api/space/${spaceId}/resource-pricing/skills`, {
    method: 'GET',
  });
}

/**
 * 创建技能定价
 */
export async function apiCreateSkillPricing(
  spaceId: number,
  data: Partial<SkillPricingInfo>,
): Promise<RequestResponse<SkillPricingInfo>> {
  return request(`/api/space/${spaceId}/resource-pricing/skills`, {
    method: 'POST',
    data,
  });
}

/**
 * 更新技能定价
 */
export async function apiUpdateSkillPricing(
  id: number,
  data: Partial<SkillPricingInfo>,
): Promise<RequestResponse<SkillPricingInfo>> {
  return request(`/api/resource-pricing/skills/${id}`, { method: 'PUT', data });
}

/**
 * 删除技能定价
 */
export async function apiDeleteSkillPricing(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/skills/${id}`, { method: 'DELETE' });
}

/**
 * 切换技能定价状态
 */
export async function apiToggleSkillPricing(
  id: number,
  enabled: boolean,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/skills/${id}/toggle`, {
    method: 'PUT',
    data: { enabled },
  });
}
