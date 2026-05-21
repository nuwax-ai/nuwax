// 积分套餐状态：0-禁用，1-启用
export enum CreditPackageStatusEnum {
  Disabled = 0,
  Enabled = 1,
}

/**
 * 积分流水类型
 * 可用值:SUBSCRIPTION,PURCHASE,ACTIVITY,MANUAL,LOAN,MODEL_CALL,AGENT_CALL,TOOL_CALL,MANUAL_DEDUCT
 */
export enum CreditFlowTypeEnum {
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

// 操作类型：1-增加，2-扣减
export enum CreditFlowOperationTypeEnum {
  INCREASE = 1,
  DECREASE = 2,
}

// ================================ 接口参数类型 ================================

// 积分套餐信息
export interface CreditPackageInfo {
  /*套餐ID */
  id?: number;

  /*套餐名称 */
  packageName?: string;

  /*积分数量 */
  creditAmount?: number;

  /*价格 */
  price?: number;

  /*排序 */
  sort?: number;

  /*状态：0-禁用，1-启用 */
  status?: CreditPackageStatusEnum;

  /*创建时间 */
  created?: Record<string, unknown>;

  /*有效期（月） */
  period?: number;

  /*更新时间 */
  modified?: Record<string, unknown>;

  /*备注 */
  remark?: string;
}

/**
 * 积分套餐排序信息
 */
export interface CreditPackageSortItem {
  id: number;
  sort: number;
}

/**
 * 用户积分查询
 */
export interface UserCreditSummarySearchParams {
  usernamePhoneOrEmail?: string;
  userId?: number;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 用户积分查询用户信息
 */
export interface CreditSummaryUserInfo {
  username: string;
  phone: string;
  email: string;
}

/**
 * 积分扣减参数
 */
export interface DeductCreditParams {
  /*租户ID */
  tenantId: number;

  /*用户ID */
  userId: number;

  /*积分类型：SUBSCRIPTION-订阅积分，PURCHASE-增购积分，ACTIVITY-活动积分，MANUAL-手动发放,可用值:SUBSCRIPTION,PURCHASE,ACTIVITY,MANUAL,LOAN,MODEL_CALL,AGENT_CALL,TOOL_CALL,MANUAL_DEDUCT */
  creditType: CreditFlowTypeEnum;

  /*积分数量 */
  amount: number;

  /*业务单号，用于幂等 */
  bizNo?: string;

  /*是否允许透支，默认false */
  allowNegative?: boolean;

  /*备注 */
  remark?: string;
}

/**
 * 积分发放参数
 */
export interface AddCreditParams {
  /*租户ID */
  tenantId: number;

  /*用户ID */
  userId: number;

  /*积分类型：SUBSCRIPTION-订阅积分，PURCHASE-增购积分，ACTIVITY-活动积分，MANUAL-手动发放,可用值:SUBSCRIPTION,PURCHASE,ACTIVITY,MANUAL,LOAN,MODEL_CALL,AGENT_CALL,TOOL_CALL,MANUAL_DEDUCT */
  creditType: CreditFlowTypeEnum;

  /*积分数量 */
  amount: number;

  /*业务单号，用于幂等 */
  bizNo?: string;

  /*过期时间，为空表示永不过期 */
  expireTime?: string;

  /*备注 */
  remark?: string;
}

/**
 * 用户积分查询
 */
export interface UserCreditSummaryInfo {
  // 用户ID
  userId?: number;
  // 总积分
  totalCredit?: number;
  // 订阅积分
  subscriptionCredit?: number;
  // 增购积分
  purchaseCredit?: number;
  // 活动积分
  activityCredit?: number;
  // 手动发放积分
  manualCredit?: number;
  // 用户信息
  user: CreditSummaryUserInfo;
}

/**
 * 用户积分流水明细查询
 */
export interface UserCreditFlowSearchParams
  extends UserCreditSummarySearchParams {
  // 可用值:SUBSCRIPTION,PURCHASE,ACTIVITY,MANUAL,LOAN,MODEL_CALL,AGENT_CALL,TOOL_CALL,MANUAL_DEDUCT
  creditType?: CreditFlowTypeEnum;
  lastId?: number;
  pageSize?: number;
}

/**
 * 用户积分流水明细
 */
export interface UserCreditFlowInfo {
  // 流水ID
  id: number;
  // 用户ID
  userId: string;
  // 批次号
  batchNo: string;
  // 积分类型
  creditType: CreditFlowTypeEnum;
  // 积分类型名称
  creditTypeName: string;
  // 操作类型：1-增加，2-扣减
  operationType: CreditFlowOperationTypeEnum;
  // 操作类型名称
  operationTypeName: string;
  // 积分数量
  amount: number;
  // 操作前积分
  beforeAmount: number;
  // 操作后积分
  afterAmount: number;
  // 业务单号
  bizNo: string;
  // 创建时间
  created: string;
  // 备注
  remark: string;
  // 用户信息
  user: CreditSummaryUserInfo;
}
