import {
  SubscriptionPlanInfo,
  SubscriptionPlanSortItem,
  SubscriptionPlanStatsResult,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import type { RequestResponse } from '@/types/interfaces/request';
import { BillOrderInfo } from '@/types/interfaces/subscription';
import { request } from 'umi';

/**
 * 下架订阅计划
 */
export async function apiOfflineAgentSubscriptionPlan(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/agent/plan/${id}/offline`, {
    method: 'POST',
  });
}

/**
 * 删除订阅计划
 */
export async function apiDeleteAgentSubscriptionPlan(
  id: number,
): Promise<RequestResponse<boolean>> {
  return request(`/api/agent/plan/${id}/delete`, {
    method: 'POST',
  });
}

/**
 * 修改订阅计划
 */
export async function apiUpdateAgentSubscriptionPlan(
  data: SubscriptionPlanInfo,
): Promise<RequestResponse<null>> {
  return request('/api/agent/plan/update', {
    method: 'POST',
    data,
  });
}

/**
 * 修改订阅计划排序
 */
export async function apiUpdateAgentSubscriptionPlanSort(
  data: SubscriptionPlanSortItem[],
): Promise<RequestResponse<null>> {
  return request('/api/agent/plan/sort/update', {
    method: 'POST',
    data,
  });
}

/**
 * 添加订阅计划
 */
export async function apiCreateAgentSubscriptionPlan(
  data: SubscriptionPlanInfo,
): Promise<RequestResponse<null>> {
  return request('/api/agent/plan/create', {
    method: 'POST',
    data,
  });
}

/**
 * 查询智能体订阅统计
 */
export async function apiGetAgentSubscriptionPlanStats(params: {
  agentId: number;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<SubscriptionPlanStatsResult>> {
  return request('/api/agent/plan/subscription/stats', {
    method: 'GET',
    params,
  });
}

/**
 * 查询订阅计划列表
 */
export async function apiGetAgentSubscriptionPlanList(params: {
  agentId: number;
  status?: number;
  keyword?: string;
}): Promise<RequestResponse<SubscriptionPlanInfo[]>> {
  return request('/api/agent/plan/list', {
    method: 'GET',
    params,
  });
}

/**
 * 创建订阅订单
 */
export async function apiCreateAgentSubscriptionOrder(
  planId: number,
): Promise<RequestResponse<BillOrderInfo>> {
  return request('/api/subscription/order/create', {
    method: 'POST',
    params: {
      planId,
    },
  });
}

/**
 * 获取订单收银台地址
 */
export async function apiGetAgentSubscriptionOrderCashier(
  orderId: number | string,
): Promise<RequestResponse<{ cashierUrl: string }>> {
  return request('/api/bill/order/pay/cashier', {
    method: 'GET',
    params: {
      orderId,
    },
  });
}
