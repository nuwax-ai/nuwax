import type { RequestResponse } from '@/types/interfaces/request';
import type {
  AdminPaymentOrderRecord,
  AgentSubscriptionPlan,
  BillOrderInfo,
  BillOrderStatusEnum,
  BillPayStatusEnum,
  BillWithdrawApplyResponse,
  BillWithdrawRecordInfo,
  BillWithdrawStatusEnum,
  BizTypeEnum,
  CheckSubscriptionResult,
  CreditBatchItem,
  CreditPackageInfo,
  CreditRecordInfo,
  CreditSummaryInfo,
  CreditTypeEnum,
  DailyRevenueDetailRecord,
  DailyRevenueRecord,
  DevPaymentAccountRecord,
  MerchantOnboardingData,
  MySubscriptionData,
  RevenueStatsInfo,
  RevenueStatsParams,
  RevenueStatsResponse,
  SubscriptionPlan,
  SystemSubscriptionPlan,
  UserSubscriptionInfo,
  WithdrawConfig,
} from '@/types/interfaces/subscription';

import { request } from 'umi';

// 查询我的订阅（新版）
export async function apiGetMySubscription(params: {
  bizType: BizTypeEnum;
  bizId?: number;
}): Promise<RequestResponse<MySubscriptionData>> {
  return request('/api/subscription/my', { method: 'GET', params });
}

// 查询我的每日收益
export async function apiListDailyRevenue(params: {
  dt?: string;
}): Promise<RequestResponse<DailyRevenueRecord[]>> {
  return request('/api/bill/revenue/daily', { method: 'GET', params });
}

// 查询我的收益明细
export async function apiListDailyRevenueDetail(params: {
  dt: string;
  pageNum: number;
  pageSize: number;
}): Promise<
  RequestResponse<{ records: DailyRevenueDetailRecord[]; total: number }>
> {
  return request('/api/bill/revenue/detail', { method: 'GET', params });
}

// 查询提现配置
export async function apiGetWithdrawConfig(): Promise<
  RequestResponse<WithdrawConfig>
> {
  return request('/api/system/bill/withdraw/config', { method: 'GET' });
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

// 查询我的订单（账单中心版）
export async function apiGetMyBillOrders(params: {
  orderStatus?: BillOrderStatusEnum | null;
  payStatus?: BillPayStatusEnum | null;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<{ records: BillOrderInfo[]; total: number }>> {
  return request('/api/bill/order/my', { method: 'GET', params });
}

// ──────────────────────────────────────────────
// 我的收益
// ──────────────────────────────────────────────

/**
 * 查询收益统计
 */
export async function apiGetRevenueStats(): Promise<
  RequestResponse<RevenueStatsInfo>
> {
  return request('/api/bill/revenue/stats', { method: 'GET' });
}

/**
 * 创建提现申请
 */
export async function apiCreateWithdrawApply(): Promise<
  RequestResponse<BillWithdrawApplyResponse>
> {
  return request('/api/bill/withdraw/create', { method: 'POST' });
}

/**
 * 查询提现记录
 */
export async function apiListWithdrawRecords(params: {
  pageNum?: number;
  pageSize?: number;
}): Promise<
  RequestResponse<{ records: BillWithdrawRecordInfo[]; total: number }>
> {
  return request('/api/bill/withdraw/records', { method: 'GET', params });
}

/**
 * 用户端查询提现配置
 */
export async function apiGetUserWithdrawConfig(): Promise<
  RequestResponse<WithdrawConfig>
> {
  return request('/api/bill/withdraw/config', { method: 'GET' });
}

// ──────────────────────────────────────────────
// 积分
// ──────────────────────────────────────────────

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

/**
 * 创建积分增购订单
 */
export async function apiCreateCreditOrder(params: {
  packageId: number;
}): Promise<RequestResponse<BillOrderInfo>> {
  return request('/api/credit/order/create', {
    method: 'POST',
    params,
  });
}

/**
 * 查询可订阅的系统计划列表
 */
export async function apiListSystemSubscriptionPlans(): Promise<
  RequestResponse<SystemSubscriptionPlan[]>
> {
  return request('/api/subscription/system/plans', { method: 'GET' });
}

export async function apiPurchaseCredits(
  packageId: number,
): Promise<RequestResponse<{ payUrl?: string; qrCode?: string }>> {
  return request('/api/credits/purchase', {
    method: 'POST',
    data: { packageId },
  });
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

// ──────────────────────────────────────────────
// 系统管理 - 商户进件 (新版)
// ──────────────────────────────────────────────

/**
 * 按租户查询进件
 */
export async function apiGetMerchantOnboardingByTenantId(): Promise<
  RequestResponse<MerchantOnboardingData>
> {
  return request('/api/system/pay/merchant-onboarding/get-by-tenant-id', {
    method: 'POST',
  });
}

/**
 * 新增进件
 */
export async function apiAddMerchantOnboarding(
  data: Partial<MerchantOnboardingData>,
): Promise<RequestResponse<MerchantOnboardingData>> {
  return request('/api/system/pay/merchant-onboarding/add', {
    method: 'POST',
    data,
  });
}

/**
 * 更新进件
 */
export async function apiUpdateMerchantOnboarding(
  data: Partial<MerchantOnboardingData>,
): Promise<RequestResponse<MerchantOnboardingData>> {
  return request('/api/system/pay/merchant-onboarding/update', {
    method: 'POST',
    data,
  });
}

/**
 * 分页查询开发者收款账户（新版）
 */
export async function apiPageDevPaymentAccounts(data: {
  userNameKeyword?: string;
  userId?: number;
  createdStart?: string;
  createdEnd?: string;
  page: number;
  pageSize: number;
}): Promise<
  RequestResponse<{
    records: DevPaymentAccountRecord[];
    total: number;
    page: number;
    pageSize: number;
  }>
> {
  return request('/api/system/pay/developer-account/page', {
    method: 'POST',
    data,
  });
}

// ──────────────────────────────────────────────
// 系统管理 - 提现管理
// ──────────────────────────────────────────────

export async function apiListWithdrawals(params: {
  keyword?: string;
  status?: BillWithdrawStatusEnum;
  pageNum?: number;
  pageSize?: number;
}): Promise<
  RequestResponse<{ records: BillWithdrawRecordInfo[]; total: number }>
> {
  return request('/api/system/bill/withdraw/list', { method: 'GET', params });
}

export async function apiProcessWithdrawal(data: {
  tenantId: number;
  applicationId: number;
  action: 'APPROVE' | 'REJECT' | 'COMPLETE_PAYMENT';
  rejectReason?: string;
  paymentExtra?: any;
}): Promise<RequestResponse<boolean>> {
  return request('/api/system/bill/withdraw/process', {
    method: 'POST',
    data,
  });
}

/**
 * 保存提现配置
 */
export async function apiSaveWithdrawConfig(data: {
  minAmount: number;
  monthlyLimit: number;
  dailyLimit: number;
  limitMode: string;
}): Promise<RequestResponse<boolean>> {
  return request('/api/system/bill/withdraw/config/save', {
    method: 'POST',
    data,
  });
}

/**
 * 分页查询系统支付订单（新版）
 */
export async function apiPageAdminPaymentOrders(data: {
  bizOrderNo?: string;
  paymentStatus?: string;
  payChannel?: string;
  createdStart?: string;
  createdEnd?: string;
  page: number;
  pageSize: number;
}): Promise<
  RequestResponse<{
    records: AdminPaymentOrderRecord[];
    total: number;
    page: number;
    pageSize: number;
  }>
> {
  return request('/api/system/pay/order/page', {
    method: 'POST',
    data,
  });
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

/**
 * 系统管理 - 查询开发者收益统计 (支持按月过滤、排行、列表)
 */
export async function apiGetSystemRevenueStats(
  params: RevenueStatsParams,
): Promise<RequestResponse<RevenueStatsResponse>> {
  return request('/api/system/bill/revenue/stats', {
    method: 'GET',
    params,
  });
}
