import type { RequestResponse } from '@/types/interfaces/request';
import type {
  AdminCreditRecordInfo,
  AdminOrderInfo,
  AgentSubscriptionConfig,
  CheckSubscriptionResult,
  CreditPackageAdminInfo,
  CreditPackageInfo,
  CreditRecordInfo,
  CreditRecordTypeEnum,
  DevEarningsSummaryInfo,
  DevPaymentAccountInfo,
  EarningRecordInfo,
  EarningsSummaryInfo,
  MerchantInfoData,
  OrderInfo,
  PaymentConfigInfo,
  PricingPlanInfo,
  SubscriptionSummaryInfo,
  UserCreditBalanceInfo,
  UserCreditsInfo,
  UserSubscriptionInfo,
  WithdrawalInfo,
  WithdrawalStatusEnum,
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

// ──────────────────────────────────────────────
// 系统管理 - 支付与收益（开发者）
// ──────────────────────────────────────────────

export async function apiGetDevEarningsSummary(): Promise<
  RequestResponse<DevEarningsSummaryInfo>
> {
  return request('/api/system/dev-earnings-summary', { method: 'GET' });
}

export async function apiListDevEarnings(params: {
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: EarningRecordInfo[]; total: number }>> {
  return request('/api/system/dev-earnings', { method: 'GET', params });
}

// ──────────────────────────────────────────────
// 系统管理 - 订阅与积分（管理员）
// ──────────────────────────────────────────────

export async function apiGetSubscriptionSummary(): Promise<
  RequestResponse<SubscriptionSummaryInfo>
> {
  return request('/api/system/subscription-summary', { method: 'GET' });
}

// ──────────────────────────────────────────────
// 系统管理 - 积分套餐 CRUD
// ──────────────────────────────────────────────

export async function apiListAdminCreditPackages(): Promise<
  RequestResponse<CreditPackageAdminInfo[]>
> {
  return request('/api/system/credit-packages', { method: 'GET' });
}

export async function apiCreateCreditPackage(
  data: Partial<CreditPackageAdminInfo>,
): Promise<RequestResponse<CreditPackageAdminInfo>> {
  return request('/api/system/credit-packages', { method: 'POST', data });
}

export async function apiUpdateCreditPackage(
  id: number,
  data: Partial<CreditPackageAdminInfo>,
): Promise<RequestResponse<CreditPackageAdminInfo>> {
  return request(`/api/system/credit-packages/${id}`, { method: 'PUT', data });
}

export async function apiDeleteCreditPackage(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/credit-packages/${id}`, { method: 'DELETE' });
}

export async function apiToggleCreditPackage(
  id: number,
  enabled: boolean,
): Promise<RequestResponse<null>> {
  return request(`/api/system/credit-packages/${id}/toggle`, {
    method: 'PUT',
    data: { enabled },
  });
}

// ──────────────────────────────────────────────
// 系统管理 - 用户积分 / 积分流水（管理员）
// ──────────────────────────────────────────────

export async function apiListUserCreditBalances(params: {
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: UserCreditBalanceInfo[]; total: number }>> {
  return request('/api/system/user-credits', { method: 'GET', params });
}

export async function apiListAdminCreditRecords(params: {
  keyword?: string;
  recordType?: CreditRecordTypeEnum;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: AdminCreditRecordInfo[]; total: number }>> {
  return request('/api/system/credit-records', { method: 'GET', params });
}

// ──────────────────────────────────────────────
// 系统管理 - 业务订单查询（管理员）
// ──────────────────────────────────────────────

export async function apiListAdminOrders(params: {
  keyword?: string;
  orderType?: string;
  status?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: AdminOrderInfo[]; total: number }>> {
  return request('/api/system/orders', { method: 'GET', params });
}

// ──────────────────────────────────────────────
// 系统管理 - 支付配置
// ──────────────────────────────────────────────

export async function apiGetPaymentConfig(): Promise<
  RequestResponse<PaymentConfigInfo>
> {
  return request('/api/system/payment-config', { method: 'GET' });
}

export async function apiSavePaymentConfig(
  data: PaymentConfigInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/payment-config', { method: 'PUT', data });
}

// ──────────────────────────────────────────────
// 系统管理 - 商户进件信息
// ──────────────────────────────────────────────

export async function apiGetMerchantInfo(): Promise<
  RequestResponse<MerchantInfoData>
> {
  return request('/api/system/merchant-info', { method: 'GET' });
}

export async function apiSaveMerchantInfo(
  data: MerchantInfoData,
): Promise<RequestResponse<null>> {
  return request('/api/system/merchant-info', { method: 'PUT', data });
}

// ──────────────────────────────────────────────
// 系统管理 - 开发者收款账户
// ──────────────────────────────────────────────

export async function apiListDevPaymentAccounts(params: {
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: DevPaymentAccountInfo[]; total: number }>> {
  return request('/api/system/dev-payment-accounts', { method: 'GET', params });
}

// ──────────────────────────────────────────────
// 系统管理 - 提现管理
// ──────────────────────────────────────────────

export async function apiListWithdrawals(params: {
  keyword?: string;
  status?: WithdrawalStatusEnum;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: WithdrawalInfo[]; total: number }>> {
  return request('/api/system/withdrawals', { method: 'GET', params });
}

export async function apiApproveWithdrawal(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/withdrawals/${id}/approve`, { method: 'POST' });
}

export async function apiRejectWithdrawal(
  id: number,
  reason: string,
): Promise<RequestResponse<null>> {
  return request(`/api/system/withdrawals/${id}/reject`, {
    method: 'POST',
    data: { reason },
  });
}

// ──────────────────────────────────────────────
// 系统管理 - 支付订单查询（管理员）
// ──────────────────────────────────────────────

export async function apiListAdminPaymentOrders(params: {
  keyword?: string;
  status?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ list: AdminOrderInfo[]; total: number }>> {
  return request('/api/system/payment-orders', { method: 'GET', params });
}

// ──────────────────────────────────────────────
// 系统管理 - 订阅基础配置
// ──────────────────────────────────────────────

export async function apiGetBasicConfig(): Promise<
  RequestResponse<Record<string, unknown>>
> {
  return request('/api/system/subscription-basic-config', { method: 'GET' });
}

export async function apiSaveBasicConfig(
  data: Record<string, unknown>,
): Promise<RequestResponse<null>> {
  return request('/api/system/subscription-basic-config', {
    method: 'PUT',
    data,
  });
}
