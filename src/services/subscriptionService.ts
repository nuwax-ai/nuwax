import type { RequestResponse } from '@/types/interfaces/request';
import type {
  AgentSubscriptionConfig,
  CheckSubscriptionResult,
  CreditPackageInfo,
  CreditRecordInfo,
  CreditRecordTypeEnum,
  EarningRecordInfo,
  EarningsSummaryInfo,
  OrderInfo,
  PricingPlanInfo,
  UserCreditsInfo,
  UserSubscriptionInfo,
} from '@/types/interfaces/subscription';
import { request } from 'umi';

// 查询工作空间定价套餐列表
export async function apiListPricingPlans(
  spaceId: number,
): Promise<RequestResponse<PricingPlanInfo[]>> {
  return request(`/api/space/${spaceId}/pricing-plans`, { method: 'GET' });
}

// 创建定价套餐
export async function apiCreatePricingPlan(
  data: Partial<PricingPlanInfo>,
): Promise<RequestResponse<PricingPlanInfo>> {
  return request('/api/pricing-plans', { method: 'POST', data });
}

// 更新定价套餐
export async function apiUpdatePricingPlan(
  id: number,
  data: Partial<PricingPlanInfo>,
): Promise<RequestResponse<PricingPlanInfo>> {
  return request(`/api/pricing-plans/${id}`, { method: 'PUT', data });
}

// 删除定价套餐
export async function apiDeletePricingPlan(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/pricing-plans/${id}`, { method: 'DELETE' });
}

// 切换套餐启用/停用
export async function apiTogglePricingPlan(
  id: number,
  enabled: boolean,
): Promise<RequestResponse<null>> {
  return request(`/api/pricing-plans/${id}/toggle`, {
    method: 'PUT',
    data: { enabled },
  });
}

// 查询智能体用户订阅列表
export async function apiListUserSubscriptions(params: {
  spaceId: number;
  agentId?: number;
  planId?: number;
  status?: string;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: UserSubscriptionInfo[]; total: number }>> {
  return request('/api/subscriptions', { method: 'GET', params });
}

// 查询智能体订阅配置
export async function apiGetAgentSubscriptionConfig(
  agentId: string | number,
): Promise<RequestResponse<AgentSubscriptionConfig>> {
  return request(`/api/agent/${agentId}/subscription-config`, {
    method: 'GET',
  });
}

// 保存智能体订阅配置
export async function apiSaveAgentSubscriptionConfig(
  agentId: string | number,
  data: AgentSubscriptionConfig,
): Promise<RequestResponse<null>> {
  return request(`/api/agent/${agentId}/subscription-config`, {
    method: 'PUT',
    data,
  });
}

// 检查用户对某智能体的订阅状态
export async function apiCheckSubscription(
  agentId: string | number,
): Promise<RequestResponse<CheckSubscriptionResult>> {
  return request(`/api/agent/${agentId}/check-subscription`, { method: 'GET' });
}

// 用户订阅套餐
export async function apiSubscribePlan(data: {
  agentId: string | number;
  planId: number;
}): Promise<RequestResponse<UserSubscriptionInfo>> {
  return request('/api/subscriptions', { method: 'POST', data });
}

// ──────────────────────────────────────────────
// 我的订阅（用户视角）
// ──────────────────────────────────────────────

export async function apiListMySubscriptions(params: {
  status?: string;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: UserSubscriptionInfo[]; total: number }>> {
  return request('/api/user/subscriptions', { method: 'GET', params });
}

export async function apiCancelSubscription(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/subscriptions/${id}`, { method: 'DELETE' });
}

// ──────────────────────────────────────────────
// 我的订单
// ──────────────────────────────────────────────

export async function apiListMyOrders(params: {
  orderType?: string;
  status?: string;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: OrderInfo[]; total: number }>> {
  return request('/api/user/orders', { method: 'GET', params });
}

export async function apiRefundOrder(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/orders/${id}/refund`, { method: 'POST' });
}

// ──────────────────────────────────────────────
// 我的收益
// ──────────────────────────────────────────────

export async function apiGetEarningsSummary(): Promise<
  RequestResponse<EarningsSummaryInfo>
> {
  return request('/api/user/earnings/summary', { method: 'GET' });
}

export async function apiListMyEarnings(params: {
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: EarningRecordInfo[]; total: number }>> {
  return request('/api/user/earnings', { method: 'GET', params });
}

// ──────────────────────────────────────────────
// 积分
// ──────────────────────────────────────────────

export async function apiGetUserCredits(): Promise<
  RequestResponse<UserCreditsInfo>
> {
  return request('/api/user/credits', { method: 'GET' });
}

export async function apiListCreditPackages(): Promise<
  RequestResponse<CreditPackageInfo[]>
> {
  return request('/api/credits/packages', { method: 'GET' });
}

export async function apiPurchaseCredits(
  packageId: number,
): Promise<RequestResponse<{ payUrl?: string; qrCode?: string }>> {
  return request('/api/credits/purchase', {
    method: 'POST',
    data: { packageId },
  });
}

export async function apiListCreditRecords(params: {
  recordType?: CreditRecordTypeEnum;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: CreditRecordInfo[]; total: number }>> {
  return request('/api/user/credit-records', { method: 'GET', params });
}
