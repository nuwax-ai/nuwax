import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import {
  SubscriptionPlanInfo,
  SubscriptionPlanListParams,
  SubscriptionPlanSortItem,
  SubscriptionPlanStatsParams,
  SubscriptionPlanStatsResult,
} from '../types/subscription';

/**
 * 下架订阅计划
 */
export async function apiOfflineSubscriptionPlan(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/plan/${id}/offline`, {
    method: 'POST',
  });
}

/**
 * 删除订阅计划
 */
export async function apiDeleteSubscriptionPlan(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/plan/${id}/delete`, {
    method: 'POST',
  });
}

/**
 * 修改订阅计划
 */
export async function apiUpdateSubscriptionPlan(
  data: SubscriptionPlanInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/plan/update', {
    method: 'POST',
    data,
  });
}

/**
 * 修改订阅计划排序
 */
export async function apiUpdateSubscriptionPlanSort(
  data: SubscriptionPlanSortItem[],
): Promise<RequestResponse<null>> {
  return request('/api/system/plan/sort/update', {
    method: 'POST',
    data,
  });
}

/**
 * 添加订阅计划
 */
export async function apiCreateSubscriptionPlan(
  data: SubscriptionPlanInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/plan/create', {
    method: 'POST',
    data,
  });
}

/**
 * 查询指定对象的订阅统计
 */
export async function apiGetSubscriptionPlanStats(
  params: SubscriptionPlanStatsParams,
): Promise<RequestResponse<SubscriptionPlanStatsResult>> {
  return request('/api/system/plan/subscription/stats', {
    method: 'GET',
    params,
  });
}

/**
 * 查询订阅计划列表
 */
export async function apiGetSubscriptionPlanList(
  data: SubscriptionPlanListParams,
): Promise<RequestResponse<SubscriptionPlanInfo[]>> {
  const { status, keyword } = data;
  return request(`/api/system/plan/list?status=${status}&keyword=${keyword}`, {
    method: 'GET',
  });
}
