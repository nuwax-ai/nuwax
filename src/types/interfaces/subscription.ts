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

export enum BizTypeEnum {
  System = 'SYSTEM',
  Agent = 'AGENT',
  Skill = 'SKILL',
}

export enum MySubscriptionStatusEnum {
  Active = 'ACTIVE',
  Expired = 'EXPIRED',
  Cancelled = 'CANCELLED',
}

export enum MyPlanPeriodEnum {
  Month = 'MONTH',
  Quarter = 'QUARTER',
  Year = 'YEAR',
  Forever = 'FOREVER',
}

export interface MySubscriptionItem {
  id: number | null;
  tenantId: number | null;
  userId: number | null;
  planId: number;
  planName: string;
  bizType: BizTypeEnum | null;
  bizId: number | null;
  period: MyPlanPeriodEnum | null;
  startTime: string | null;
  endTime: string | null;
  status: MySubscriptionStatusEnum;
  plan: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    firstPrice: number;
    period: MyPlanPeriodEnum;
    creditAmount: number;
    callLimitCount: number | null;
    functionOnly: boolean | null;
    dailyGiftCreditAmount: number | null;
    isHot: boolean | null;
    status: number | null;
    bizType: BizTypeEnum;
    bizId: number | null;
    groupIds: string | null;
    extra: string | null;
    sort: number | null;
    created: string | null;
    modified: string | null;
  };
  callUsedCount: number | null;
  nextResetTime: string | null;
  extra: any | null;
  created: string | null;
  modified: string | null;
}

export interface MySubscriptionData {
  currentSubscription: MySubscriptionItem;
  subscriptions: MySubscriptionItem[];
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
  packageName: string;
  creditAmount: number;
  price: number;
  sort: number;
  status: number;
  period: MyPlanPeriodEnum;
  remark?: string;
  created?: string;
  modified?: string;
}

export enum CreditRecordTypeEnum {
  Recharge = 'recharge',
  Consume = 'consume',
  Refund = 'refund',
}

export interface CreditRecordInfo {
  id: number;
  userId: number;
  batchNo: string;
  creditType: string;
  creditTypeName: string;
  operationType: 1 | 2; // 操作类型：1-增加，2-扣减
  operationTypeName: string;
  amount: number;
  beforeAmount: number;
  afterAmount: number; // 剩余积分
  bizNo: string;
  created: string; // 时间
  remark: string; // 说明
  user: {
    username: string;
    phone: string;
    email: string;
  };
}

export interface UserCreditsInfo {
  balance: number;
  unit: 'credit';
}

export interface CreditSummaryInfo {
  userId: number;
  totalCredit: number;
  subscriptionCredit: number;
  purchaseCredit: number;
  activityCredit: number;
  manualCredit: number;
  user: any;
}

export enum CreditTypeEnum {
  SUBSCRIPTION = 'SUBSCRIPTION',
  PURCHASE = 'PURCHASE',
  ACTIVITY = 'ACTIVITY',
  MANUAL = 'MANUAL',
  LOAN = 'LOAN',
  MODEL_CALL = 'MODEL_CALL',
  AGENT_CALL = 'AGENT_CALL',
  TOOL_CALL = 'TOOL_CALL',
  MANUAL_DEDUCT = 'MANUAL_DEDUCT',
}

export interface CreditBatchItem {
  id: number;
  userId: number;
  batchNo: string;
  creditType: CreditTypeEnum | string;
  creditTypeName: string;
  totalAmount: number;
  usedAmount: number;
  remainAmount: number;
  expireTime: string;
  expired: boolean;
  created: string;
  remark: string;
  extra?: {
    price?: number;
  };
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
// 账单订单相关（联调接口专用）
// ──────────────────────────────────────────────

export enum BillOrderStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum BillPayStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CLOSED = 'CLOSED',
}

export interface BillOrderItem {
  id: number | string;
  orderId: number | string;
  targetType: string;
  targetName: string;
  targetId: number | string;
  price: number;
  count: number;
  snapshot?: any;
  created: string;
}

export interface BillOrderInfo {
  id: number | string;
  tenantId: number | string;
  userId: number | string;
  description: string;
  bizType: string;
  orderStatus: BillOrderStatusEnum;
  payStatus: BillPayStatusEnum;
  amount: number;
  created: string;
  modified: string;
  items?: BillOrderItem[];
  extra?: any;
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

export interface RevenueStatsInfo {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingAmount: number;
  settledAmount: number;
  dailyRevenues: any[];
}

export interface EarningRecordInfo {
  id: number;
  developerName?: string;
  agentName: string;
  userName: string;
  planName: string;
  cycle: PricingCycleEnum;
  earnings: number;
  settlementStatus: SettlementStatusEnum;
  createdAt: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 支付与收益
// ──────────────────────────────────────────────

export interface DevEarningsSummaryInfo {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingSettlement: number;
  developerCount: number;
}

// ──────────────────────────────────────────────
// 系统管理 - 订阅与积分汇总
// ──────────────────────────────────────────────

export interface SubscriptionSummaryInfo {
  activeSubscriptions: number;
  totalUsers: number;
  monthlyRevenue: number;
  totalCredits: number;
}

// ──────────────────────────────────────────────
// 系统管理 - 积分套餐（管理员）
// ──────────────────────────────────────────────

export interface CreditPackageAdminInfo {
  id: number;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  tag?: string;
  enabled: boolean;
  createdAt: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 用户积分余额（管理员视角）
// ──────────────────────────────────────────────

export interface UserCreditBalanceInfo {
  userId: number;
  userName: string;
  balance: number;
  totalRecharge: number;
  totalConsume: number;
  lastUpdatedAt: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 管理员积分明细
// ──────────────────────────────────────────────

export interface AdminCreditRecordInfo extends CreditRecordInfo {
  userName: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 管理员订单（含用户名）
// ──────────────────────────────────────────────

export interface AdminOrderInfo extends OrderInfo {
  userName: string;
  developerName?: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 支付配置
// ──────────────────────────────────────────────

export interface PaymentConfigInfo {
  alipayAppId: string;
  alipayPrivateKey: string;
  alipayPublicKey: string;
  alipayNotifyUrl: string;
  wechatAppId: string;
  wechatMchId: string;
  wechatApiKey: string;
  wechatNotifyUrl: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 商户进件信息
// ──────────────────────────────────────────────

export interface MerchantInfoData {
  companyName: string;
  creditCode: string;
  legalPerson: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  businessLicense?: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ──────────────────────────────────────────────
// 订阅套餐（workspace 管理员 CRUD）
// ──────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  desc?: string;
  cycle: '月' | '季' | '年';
  price: number;
  calls: number; // -1 = 不限
  trialCalls: number;
  funcOnly: boolean;
  active: boolean;
}

// 用于智能体订阅页面的套餐展示
export interface AgentSubscriptionPlan {
  id: string;
  name: string;
  desc: string;
  cycle: string;
  price: number;
  calls: string;
  callsNum: number;
  trialCalls: number;
  recommend: boolean;
}

// 智能体用户当前订阅信息
export interface AgentCurrentSubscription {
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 开发者收款账户
// ──────────────────────────────────────────────

export enum DevPaymentTypeEnum {
  Alipay = 'alipay',
  BankCard = 'bankcard',
}

export interface DevPaymentAccountInfo {
  id: number;
  developerId: number;
  developerName: string;
  accountType: DevPaymentTypeEnum;
  accountNo: string;
  realName: string;
  bankName?: string;
  createdAt: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 提现申请
// ──────────────────────────────────────────────

export enum WithdrawalStatusEnum {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum BillWithdrawStatusEnum {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export interface BillWithdrawApplyResponse {
  id: number;
  userId: number;
  amount: number;
  status: BillWithdrawStatusEnum;
  rejectReason?: string;
  paymentExtra?: any;
  revenues?: any[];
  created: string;
  modified: string;
}

// ──────────────────────────────────────────────
// 资源定价（模型/工具/技能）
// ──────────────────────────────────────────────

export interface ModelPriceTier {
  label: string; // e.g. "≤32K"
  inputPrice: number;
  outputPrice: number;
  cachePrice: number;
}

export interface ModelPricingInfo {
  id: number;
  name: string;
  provider: string;
  tiers: ModelPriceTier[];
  enabled: boolean;
}

export interface ToolPricingInfo {
  id: number;
  name: string;
  category: 'plugin' | 'workflow' | 'mcp';
  description: string;
  price: number;
  period: string;
  calls: number;
  trialCount: number;
  enabled: boolean;
  createdAt: string;
}

export interface SkillPricingInfo {
  id: number;
  name: string;
  category: 'voice' | 'vision' | 'text';
  description: string;
  pricingModel: 'buyout' | 'monthly';
  price: number;
  calls: number;
  enabled: boolean;
  createdAt: string;
}

export interface WithdrawalInfo {
  id: number;
  developerId?: number;
  developerName: string;
  amount: number;
  accountType: DevPaymentTypeEnum;
  accountNo: string;
  realName: string;
  bankName?: string;
  status: WithdrawalStatusEnum;
  rejectReason?: string;
  createdAt: string;
  processedAt?: string;
}
