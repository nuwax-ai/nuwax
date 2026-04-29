export enum SubscriptionStatusEnum {
  Active = 'active',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export enum PricingCycleEnum {
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Yearly = 'yearly',
}

export interface PricingPlanInfo {
  id: number;
  spaceId: number;
  name: string;
  description?: string;
  price: number;
  cycle: PricingCycleEnum;
  benefits?: string[];
  agentIds?: number[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscriptionInfo {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  agentId: number;
  agentName: string;
  planId: number;
  planName: string;
  price: number;
  cycle: PricingCycleEnum;
  status: SubscriptionStatusEnum;
  startAt: string;
  expireAt: string;
  createdAt: string;
}

export interface AgentSubscriptionConfig {
  enabled: boolean;
  trialCount: number;
  planIds: number[];
  description?: string;
}

export interface CheckSubscriptionResult {
  hasSubscription: boolean;
  trialRemaining: number;
  plans: PricingPlanInfo[];
}

// ──────────────────────────────────────────────
// 积分相关
// ──────────────────────────────────────────────

export interface CreditPackageInfo {
  id: number;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  tag?: string;
}

export enum CreditRecordTypeEnum {
  Recharge = 'recharge',
  Consume = 'consume',
  Refund = 'refund',
}

export interface CreditRecordInfo {
  id: number;
  recordType: CreditRecordTypeEnum;
  description: string;
  amount: number;
  balance: number;
  createdAt: string;
}

export interface UserCreditsInfo {
  balance: number;
  unit: 'credit';
}

// ──────────────────────────────────────────────
// 订单相关
// ──────────────────────────────────────────────

export enum OrderTypeEnum {
  Subscription = 'subscription',
  Credits = 'credits',
}

export enum OrderStatusEnum {
  Paid = 'paid',
  Pending = 'pending',
  Refunded = 'refunded',
}

export interface OrderInfo {
  id: number;
  orderNo: string;
  productName: string;
  orderType: OrderTypeEnum;
  amount: number;
  payMethod?: string;
  status: OrderStatusEnum;
  createdAt: string;
}

// ──────────────────────────────────────────────
// 收益相关
// ──────────────────────────────────────────────

export enum SettlementStatusEnum {
  Pending = 'pending',
  Settled = 'settled',
}

export interface EarningsSummaryInfo {
  totalEarnings: number;
  monthlyEarnings: number;
  subscriberCount: number;
  pendingSettlement: number;
}

export interface EarningRecordInfo {
  id: number;
  agentName: string;
  userName: string;
  planName: string;
  cycle: PricingCycleEnum;
  earnings: number;
  settlementStatus: SettlementStatusEnum;
  createdAt: string;
}
