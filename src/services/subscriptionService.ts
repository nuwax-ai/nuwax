import type { RequestResponse } from '@/types/interfaces/request';
import type {
  AdminCreditRecordInfo,
  AdminOrderInfo,
  AgentSubscriptionConfig,
  AgentSubscriptionPlan,
  BillOrderInfo,
  BillOrderStatusEnum,
  BizTypeEnum,
  CheckSubscriptionResult,
  CreditBatchItem,
  CreditPackageAdminInfo,
  CreditPackageInfo,
  CreditRecordInfo,
  CreditRecordTypeEnum,
  CreditSummaryInfo,
  CreditTypeEnum,
  DevEarningsSummaryInfo,
  DevPaymentAccountInfo,
  EarningRecordInfo,
  EarningsSummaryInfo,
  MerchantInfoData,
  ModelPricingInfo,
  MySubscriptionData,
  OrderInfo,
  PaymentConfigInfo,
  PricingPlanInfo,
  SkillPricingInfo,
  SubscriptionPlan,
  SubscriptionSummaryInfo,
  ToolPricingInfo,
  UserCreditBalanceInfo,
  UserCreditsInfo,
  UserSubscriptionInfo,
  WithdrawalInfo,
  WithdrawalStatusEnum,
} from '@/types/interfaces/subscription';
import { request } from 'umi';

// 查询我的订阅（新版）
export async function apiGetMySubscription(params: {
  bizType: BizTypeEnum;
}): Promise<RequestResponse<MySubscriptionData>> {
  return request('/api/subscription/my', { method: 'GET', params });
}

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

// ──────────────────────────────────────────────
// 资源定价 - 模型/工具/技能
// ──────────────────────────────────────────────

export async function apiListModelPricing(
  spaceId: number,
): Promise<RequestResponse<ModelPricingInfo[]>> {
  return request(`/api/space/${spaceId}/resource-pricing/models`, {
    method: 'GET',
  });
}

export async function apiCreateModelPricing(
  spaceId: number,
  data: Partial<ModelPricingInfo>,
): Promise<RequestResponse<ModelPricingInfo>> {
  return request(`/api/space/${spaceId}/resource-pricing/models`, {
    method: 'POST',
    data,
  });
}

export async function apiUpdateModelPricing(
  id: number,
  data: Partial<ModelPricingInfo>,
): Promise<RequestResponse<ModelPricingInfo>> {
  return request(`/api/resource-pricing/models/${id}`, { method: 'PUT', data });
}

export async function apiDeleteModelPricing(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/models/${id}`, { method: 'DELETE' });
}

export async function apiToggleModelPricing(
  id: number,
  enabled: boolean,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/models/${id}/toggle`, {
    method: 'PUT',
    data: { enabled },
  });
}

export async function apiListToolPricing(
  spaceId: number,
): Promise<RequestResponse<ToolPricingInfo[]>> {
  return request(`/api/space/${spaceId}/resource-pricing/tools`, {
    method: 'GET',
  });
}

export async function apiCreateToolPricing(
  spaceId: number,
  data: Partial<ToolPricingInfo>,
): Promise<RequestResponse<ToolPricingInfo>> {
  return request(`/api/space/${spaceId}/resource-pricing/tools`, {
    method: 'POST',
    data,
  });
}

export async function apiUpdateToolPricing(
  id: number,
  data: Partial<ToolPricingInfo>,
): Promise<RequestResponse<ToolPricingInfo>> {
  return request(`/api/resource-pricing/tools/${id}`, { method: 'PUT', data });
}

export async function apiDeleteToolPricing(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/tools/${id}`, { method: 'DELETE' });
}

export async function apiToggleToolPricing(
  id: number,
  enabled: boolean,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/tools/${id}/toggle`, {
    method: 'PUT',
    data: { enabled },
  });
}

export async function apiListSkillPricing(
  spaceId: number,
): Promise<RequestResponse<SkillPricingInfo[]>> {
  return request(`/api/space/${spaceId}/resource-pricing/skills`, {
    method: 'GET',
  });
}

export async function apiCreateSkillPricing(
  spaceId: number,
  data: Partial<SkillPricingInfo>,
): Promise<RequestResponse<SkillPricingInfo>> {
  return request(`/api/space/${spaceId}/resource-pricing/skills`, {
    method: 'POST',
    data,
  });
}

export async function apiUpdateSkillPricing(
  id: number,
  data: Partial<SkillPricingInfo>,
): Promise<RequestResponse<SkillPricingInfo>> {
  return request(`/api/resource-pricing/skills/${id}`, { method: 'PUT', data });
}

export async function apiDeleteSkillPricing(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/skills/${id}`, { method: 'DELETE' });
}

export async function apiToggleSkillPricing(
  id: number,
  enabled: boolean,
): Promise<RequestResponse<null>> {
  return request(`/api/resource-pricing/skills/${id}/toggle`, {
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

// 查询我的订单（账单中心版）
export async function apiGetMyBillOrders(params: {
  orderStatus?: BillOrderStatusEnum | null;
}): Promise<RequestResponse<BillOrderInfo[]>> {
  return request('/api/bill/order/my', { method: 'GET', params });
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

// 查询当前登录用户总积分
export async function apiGetCreditSummary(): Promise<
  RequestResponse<CreditSummaryInfo>
> {
  return request('/api/credit/summary', { method: 'GET' });
}

export async function apiListCreditPackages(): Promise<
  RequestResponse<CreditPackageInfo[]>
> {
  return request('/api/credit/package/list', { method: 'GET' });
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

// 查询用户积分批次列表
export async function apiGetCreditBatches(params: {
  creditType: CreditTypeEnum | string;
}): Promise<RequestResponse<CreditBatchItem[]>> {
  return request('/api/credit/batches', { method: 'GET', params });
}

/**
 * 查询用户积分流水明细
 */
export async function apiGetCreditFlows(params: {
  creditType?: CreditTypeEnum | string;
  lastId?: number;
  pageSize?: number;
}): Promise<RequestResponse<CreditRecordInfo[]>> {
  return request('/api/credit/flows', {
    method: 'GET',
    params,
  });
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

// ──────────────────────────────────────────────
// 订阅设置 - 套餐 CRUD
// ──────────────────────────────────────────────

export async function apiListSubscriptionPlans(
  spaceId: number,
): Promise<RequestResponse<SubscriptionPlan[]>> {
  return request(`/api/space/${spaceId}/subscription-settings`, {
    method: 'GET',
  });
}

export async function apiCreateSubscriptionPlan(
  spaceId: number,
  data: Partial<SubscriptionPlan>,
): Promise<RequestResponse<SubscriptionPlan>> {
  return request(`/api/space/${spaceId}/subscription-settings`, {
    method: 'POST',
    data,
  });
}

export async function apiUpdateSubscriptionPlan(
  id: string,
  data: Partial<SubscriptionPlan>,
): Promise<RequestResponse<SubscriptionPlan>> {
  return request(`/api/subscription-settings/${id}`, { method: 'PUT', data });
}

export async function apiDeleteSubscriptionPlan(
  id: string,
): Promise<RequestResponse<null>> {
  return request(`/api/subscription-settings/${id}`, { method: 'DELETE' });
}

export async function apiToggleSubscriptionPlan(
  id: string,
  active: boolean,
): Promise<RequestResponse<null>> {
  return request(`/api/subscription-settings/${id}/toggle`, {
    method: 'PUT',
    data: { active },
  });
}

// ──────────────────────────────────────────────
// 智能体订阅页面 - 套餐展示 & 订阅操作
// ──────────────────────────────────────────────

export async function apiListAgentSubPlans(
  spaceId: number,
): Promise<RequestResponse<AgentSubscriptionPlan[]>> {
  return request(`/api/space/${spaceId}/agent-subscriptions/plans`, {
    method: 'GET',
  });
}

export async function apiGetCurrentAgentSub(spaceId: number): Promise<
  RequestResponse<{
    planId: string;
    startDate: string;
    endDate: string;
    status: string;
  }>
> {
  return request(`/api/space/${spaceId}/agent-subscriptions/current`, {
    method: 'GET',
  });
}

export async function apiSubscribeAgentPlan(
  spaceId: number,
  planId: string,
): Promise<
  RequestResponse<{
    planId: string;
    startDate: string;
    endDate: string;
    status: string;
  }>
> {
  return request(`/api/space/${spaceId}/agent-subscriptions/subscribe`, {
    method: 'POST',
    data: { planId },
  });
}
