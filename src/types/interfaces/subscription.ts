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
