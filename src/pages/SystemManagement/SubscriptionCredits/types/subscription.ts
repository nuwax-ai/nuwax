/**
 * 订阅计划相关的类型定义和枚举
 */

// ==================== 枚举定义 ====================

/**
 * 周期：1-月，3-季度，12-年,可用值:MONTH,QUARTER,YEAR,FOREVER
 */
export enum SubscriptionPlanPeriodEnum {
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  FOREVER = 'FOREVER',
}

/**
 * 业务类型：SYSTEM-系统，AGENT-智能体，SKILL-技能,可用值:SYSTEM,AGENT,SKILL
 */
export enum SubscriptionPlanBizTypeEnum {
  SYSTEM = 'SYSTEM',
  AGENT = 'AGENT',
  SKILL = 'SKILL',
}

/**
 * 状态：0-下线，1-上线
 */
export enum SubscriptionPlanStatusEnum {
  Offline = 0,
  Online = 1,
}
/**
 * 用户订阅状态：0-生效中，1-已过期，2-已取消,可用值:ACTIVE,EXPIRED,CANCELLED
 */
export enum UserSubscriberStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

// ==================== 接口定义 ====================

// 查询订阅计划列表
export interface SubscriptionPlanListParams {
  status: number;
  keyword: string;
}

// 订阅计划信息
export interface SubscriptionPlanInfo {
  // 计划ID
  id?: number;
  // 计划名称
  name: string;
  // 计划描述
  description: string;
  // 价格
  price: number;
  // 首次订阅价格
  firstPrice?: number;
  // 周期：1-月，3-季度，12-年,可用值:MONTH,QUARTER,YEAR,FOREVER
  period: SubscriptionPlanPeriodEnum;
  // 每月赠送积分
  creditAmount?: number;
  // 可调用次数，-1表示不限制
  callLimitCount?: number;
  // 是否仅为功能订阅（true时资源消耗费用另计）
  functionOnly?: boolean;
  // 每日登录赠送积分
  dailyGiftCreditAmount?: number;
  // 是否热门
  isHot: boolean;
  // 状态：0-下线，1-上线
  status: SubscriptionPlanStatusEnum;
  // 业务类型：SYSTEM-系统，AGENT-智能体，SKILL-技能,可用值:SYSTEM,AGENT,SKILL
  bizType?: SubscriptionPlanBizTypeEnum;
  // 业务对象ID，非SYSTEM时必填
  bizId?: string;
  // 关联用户组ID（JSON数组）
  groupIds: number[];
  // 扩展字段（JSON）
  extra?: unknown;
  // 排序，越小越靠前，前端支持拖拽
  sort: number;
  // 创建时间
  created?: string;
  // 修改时间
  modified?: string;

  /*订阅计划的权限分组项 */
  itemGroups?: {
    /*分组描述 */
    name?: string;

    /*分组描述 */
    description?: string;

    /*分组类型,可用值:BASE,MODEL,AGENT,APP,KB,API */
    groupType?: string;

    /*分组项 */
    items?: {
      /*名称 */
      name?: string;

      /*描述 */
      description?: string;

      /*图标 */
      icon?: string;

      /*是否选中 */
      selected?: boolean;
    }[];

    /*开放API权限配置 */
    openApiConfigs?: {
      /*开放api key */
      key?: string;

      /*接口调用频率限制，每分钟调用次数 */
      rpm?: Record<string, unknown>;

      /*接口调用频率限制，每天调用次数 */
      rpd?: Record<string, unknown>;
    }[];
  }[];
}

// 修改订阅计划排序项
export interface SubscriptionPlanSortItem {
  // 计划ID
  id: number;
  // 排序，越小越靠前，前端支持拖拽
  sort: number;
}

// 查询指定对象的订阅统计
export interface SubscriptionPlanStatsParams {
  // 业务类型：SYSTEM-系统，AGENT-智能体，SKILL-技能,可用值:SYSTEM,AGENT,SKILL
  bizType: SubscriptionPlanBizTypeEnum;
  // 业务对象ID，非SYSTEM时必填
  bizId: string;
  // 页码，从1开始
  pageNum?: number;
  // 每页数量
  pageSize?: number;
}

// 用户订阅信息
export interface SubscriptionPlanSubscriberInfo {
  // 订阅记录ID
  id: number;
  // 租户ID
  tenantId: number;
  // 用户ID
  userId: number;
  // 计划ID
  planId: number;
  // 计划名称
  planName: string;
  // 可用值:SYSTEM,AGENT,SKILL
  bizType: SubscriptionPlanBizTypeEnum;
  // 业务对象ID，非SYSTEM时必填
  bizId: string;
  // 周期：1-月，3-季度，12-年,可用值:MONTH,QUARTER,YEAR,FOREVER
  period: SubscriptionPlanPeriodEnum;
  // 开始时间
  startTime: string;
  // 结束时间，为空时为买断，永不过期
  endTime: string;
  // 状态：0-生效中，1-已过期，2-已取消,可用值:ACTIVE,EXPIRED,CANCELLED
  status: UserSubscriberStatusEnum;
  // 订阅计划信息
  plan: SubscriptionPlanInfo;
  // 已使用调用次数
  callUsedCount: number;
  // 下次重置时间（每月重置）
  nextResetTime: number;
  // 扩展字段，记录订阅快照等
  extra: unknown;
  // 创建时间
  created: string;
  // 修改时间
  modified: string;
}

// 查询指定对象的订阅统计返回结果
export interface SubscriptionPlanStatsResult {
  // 总订阅数
  totalCount: number;
  // 今日新订阅数
  todayCount: number;
  // 本月新订阅数
  monthCount: number;
  // 用户订阅信息
  subscribers: SubscriptionPlanSubscriberInfo[];
  // 总记录数（分页）
  total: number;
  // 当前页码
  pageNum: number;
  // 每页数量
  pageSize: number;
}
