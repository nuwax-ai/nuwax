export enum DailyRevenueStatusEnum {
  Pending = 'PENDING',
  WithdrawApplying = 'WITHDRAW_APPLYING',
  Paying = 'PAYING',
  Settled = 'SETTLED',
}

export interface DailyRevenueRecord {
  id: number;
  userId: number;
  dt: string;
  amount: number;
  status: DailyRevenueStatusEnum;
  created: string;
}

export interface DailyRevenueDetailRecord {
  id: number;
  userId: number;
  dt: string;
  amount: number;
  type: string; // PLAN, MODEL_CALL, TOOL_CALL
  typeId: number;
  orderId: number;
  targetType: string;
  targetId: number;
  bizNo: string;
  remark: string;
  extra: any;
  created: string;
}

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

// 订单状态,可用值:PENDING,PAID,CANCELLED
export enum BillOrderStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

// 支付状态,可用值:PENDING,PROCESSING,SUCCESS,FAILED,CLOSED
export enum BillPayStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CLOSED = 'CLOSED',
}

// 业务类型,可用值:CREDIT_PURCHASE,SUBSCRIPTION
export enum BillBizTypeEnum {
  CREDIT_PURCHASE = 'CREDIT_PURCHASE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

// 订单明细
export interface BillOrderItem {
  // 明细ID
  id: number;
  // 订单ID
  orderId: number;
  // 目标类型,可用值:PLAN,CREDIT_PACKAGE
  targetType: string;
  // 目标名称
  targetName: string;
  // 目标ID
  targetId: number | string;
  // 	单价
  price: number;
  // 数量
  count: number;
  // 快照信息
  snapshot?: any;
  // 创建时间
  created: string;
  // 修改时间
  // modified: string;
}

// 订单信息
export interface BillOrderInfo {
  // 订单ID
  id: number;
  // 租户ID
  tenantId: number;
  // 用户ID
  userId: number;
  // 订单描述
  description: string;
  // 业务类型,可用值:CREDIT_PURCHASE,SUBSCRIPTION
  bizType: BillBizTypeEnum;
  // 订单状态,可用值:PENDING,PAID,CANCELLED
  orderStatus: BillOrderStatusEnum;
  // 支付状态,可用值:PENDING,PROCESSING,SUCCESS,FAILED,CLOSED
  payStatus: BillPayStatusEnum;
  // 订单金额
  amount: number;
  // 订单明细
  items?: BillOrderItem[];
  // 扩展字段
  extra?: any;
  // 创建时间
  created: string;
  // 修改时间
  modified: string;
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
  unsettledAmount?: number;
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
// 系统管理 - 管理员订单（含用户名）
// ──────────────────────────────────────────────

export interface AdminOrderInfo extends OrderInfo {
  userName: string;
  developerName?: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'draft' | 'under_review';
}

export enum MerchantOnboardingStatusEnum {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface MerchantOnboardingData {
  id?: number;
  onboardingType?: string;
  tenantId?: number;
  userId?: number;
  status: MerchantOnboardingStatusEnum;
  auditRemark?: string;
  auditedAt?: string;
  merchantName: string;
  merchantShortName?: string;
  creditCode: string;
  registeredAddress?: string;
  legalPersonName: string;
  legalPersonIdNo: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bankAccountName?: string;
  bankName: string;
  bankBranchName?: string;
  bankAccountNo: string;
  bankReceiptRemark?: string;
  remark?: string;
  orgCertificateUrl?: string; // 营业执照
  licenseExpiry?: string; // 营业执照有效期
  legalPersonIdCardFrontUrl?: string; // 身份证正面
  legalPersonIdCardBackUrl?: string; // 身份证反面
  photoFinanceRoomUrl?: string;
  photoGateUrl?: string;
  photoLandmarkUrl?: string;
  bankAccountProofUrl?: string;
  created?: string;
  modified?: string;
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

export interface DevPaymentAccountRecord {
  id: number;
  tenantId: number;
  userId: number; // 开发者ID
  userName: string; // 开发者
  email: string;
  phone: string;
  realName: string;
  idCardNo: string;
  idCardFrontPhotoUrl: string;
  idCardBackPhotoUrl: string;
  bankName: string;
  branchName: string;
  bankCardNo: string; // 银行卡号
  created: string;
  modified: string;
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

export interface BillWithdrawRecordInfo {
  id: number;
  userId: number;
  userName?: string;
  phone?: string;
  email?: string;
  amount: number;
  status: BillWithdrawStatusEnum;
  rejectReason?: string;
  paymentExtra?: any;
  revenues?: any[];
  created: string;
  modified: string;
}

export type BillWithdrawApplyResponse = BillWithdrawRecordInfo;

// ──────────────────────────────────────────────
// 资源定价（模型/工具/技能）
// ──────────────────────────────────────────────

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

export interface WithdrawConfig {
  id: number;
  minAmount: number;
  monthlyLimit: number;
  dailyLimit: number;
  limitMode: string;
  created: string;
  modified: string;
}

export interface SystemSubscriptionPlanItem {
  name: string;
  description: string;
  icon: string;
  selected: boolean;
}

export interface SystemSubscriptionPlanOpenApiConfig {
  key: string;
  rpm: number;
  rpd: number;
}

export interface SystemSubscriptionPlanGroup {
  name: string;
  description: string;
  groupType: string;
  items: SystemSubscriptionPlanItem[];
  openApiConfigs: SystemSubscriptionPlanOpenApiConfig[];
}

export interface SystemSubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  firstPrice: number;
  period: string;
  creditAmount: number;
  callLimitCount: number;
  functionOnly: boolean;
  dailyGiftCreditAmount: number;
  isHot: boolean;
  status: number;
  bizType: string;
  bizId: string;
  groupIds: any[];
  extra: any;
  sort: number;
  created: string;
  modified: string;
  itemGroups: SystemSubscriptionPlanGroup[];
}

export enum PaymentStatusEnum {
  INIT = 'INIT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CLOSED = 'CLOSED',
}

export enum PayChannelEnum {
  WxPay = 'WxPay',
  AliPay = 'AliPay',
  UnionPay = 'UnionPay',
}

export interface AdminPaymentOrderRecord {
  id: number;
  tenantId: number;
  bizOrderNo: string;
  bizScene: string;
  orderAmount: number;
  subject: string;
  payMode: string; // scan
  payChannel: PayChannelEnum;
  platformFee: number;
  providerFee: number;
  netAmount: number;
  gatewayPaymentOrderNo: string;
  gatewaySyncStatus: string; // PENDING, SUCCESS, FAILED
  bizNotifyStatus: string; // POLLING, NOTIFIED, TIMEOUT
  gatewayOrderStatus: string;
  paymentStatus: PaymentStatusEnum;
  created: string;
  modified: string;
}

// ──────────────────────────────────────────────
// 系统管理 - 系统收益统计相关接口
// ──────────────────────────────────────────────

export interface DailyRevenueItem {
  id: number | null;
  userId: number;
  nickName: string | null;
  userName: string | null;
  phone: string | null;
  email: string | null;
  dt: string; // YYYYMMDD
  amount: number;
  status: string;
  created: string | null;
}

export interface RevenueStatsResponse {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingAmount: number;
  settledAmount: number;
  dailyRevenues: DailyRevenueItem[];
  userRankings: Array<{
    userId: number;
    userName: string | null;
    amount: number;
  }>;
  total: number;
}

export interface RevenueStatsParams {
  monthStart?: string; // YYYYMMDD
  monthEnd?: string; // YYYYMMDD
  status?: string; // PENDING,WITHDRAW_APPLYING,PAYING,SETTLED
  pageNum?: number;
  pageSize?: number;
}
