import {
  BillBizTypeEnum,
  BillOrderStatusEnum,
  BillPayStatusEnum,
} from '@/types/interfaces/subscription';

// 收益统计查询参数
export interface BillRevenueStatsSearchParams {
  monthStart?: number;
  monthEnd?: number;
  pageNum?: number;
  pageSize?: number;
}

// 订单收益统计信息
export interface BillRevenueStatsInfo {
  // 总收益
  totalRevenue: number;
  // 今日收益
  todayRevenue: number;
  // 本月收益
  monthRevenue: number;
  // 待结算金额
  pendingAmount: number;
  // 已结算金额
  settledAmount: number;
  // 每日收益
  dailyRevenues: {
    // 收益ID
    id: number;
    // 用户ID
    userId: number;
    // 日期
    dt: string;
    // 收益金额
    amount: number;
    // 结算状态,可用值:PENDING,WITHDRAW_APPLYING,PAYING,SETTLED
    status: string;
    // 创建时间
    created: string;
  }[];
  // 用户收益排行榜
  userRankings: {
    // 用户ID
    userId: number;
    // 用户名称
    userName: string;
    // 收益金额
    amount: number;
  }[];
  // 总页数
  total: number;
  // 	页码
  pageNum: number;
  // 每页条数
  pageSize: number;
}

// 订单查询参数
export interface BillOrderSearchParams {
  // 订单状态,可用值:PENDING,PAID,CANCELLED
  orderStatus?: BillOrderStatusEnum;
  // 支付状态,可用值:PENDING,PROCESSING,SUCCESS,FAILED,CLOSED
  payStatus?: BillPayStatusEnum;
  // 创建时间起止
  startTime?: string;
  endTime?: string;
  // 业务类型,可用值:CREDIT_PURCHASE,SUBSCRIPTION
  bizType?: BillBizTypeEnum;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}
