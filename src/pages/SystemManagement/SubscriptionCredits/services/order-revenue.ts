/**
 * 订单收益查询
 */
import { PageNum, RequestResponse } from '@/types/interfaces/request';
import { BillOrderInfo } from '@/types/interfaces/subscription';
import { request } from 'umi';
import {
  BillOrderSearchParams,
  BillRevenueStatsInfo,
  BillRevenueStatsSearchParams,
} from '../types/order-revenue';

/**
 * 收益统计（按月过滤，按用户排行）
 */
export async function apiGetOrderRevenueStats(
  params: BillRevenueStatsSearchParams,
): Promise<RequestResponse<BillRevenueStatsInfo>> {
  return request('/api/system/bill/revenue/stats', {
    method: 'GET',
    params,
  });
}

/**
 * 订单查询
 */
export async function apiGetOrderRevenueList(
  params: BillOrderSearchParams,
): Promise<RequestResponse<PageNum<BillOrderInfo>>> {
  return request('/api/system/bill/order/query', {
    method: 'GET',
    params,
  });
}
