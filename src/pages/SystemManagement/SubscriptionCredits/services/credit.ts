/**
 * 积分套餐
 */

import type { PageNum, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import {
  AddCreditParams,
  CreditPackageInfo,
  CreditPackageSortItem,
  DeductCreditParams,
  UserCreditFlowInfo,
  UserCreditFlowSearchParams,
  UserCreditSummaryInfo,
  UserCreditSummarySearchParams,
} from '../types/credit';

/**
 * 删除积分套餐
 */
export async function apiDeleteCreditPackage(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/credit/package/${id}/delete`, {
    method: 'POST',
  });
}

/**
 * 更新积分套餐
 */
export async function apiUpdateCreditPackage(
  data: CreditPackageInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/credit/package/update', {
    method: 'POST',
    data,
  });
}

/**
 * 更新积分套餐排序
 */
export async function apiUpdateCreditPackageSort(
  data: CreditPackageSortItem[],
): Promise<RequestResponse<null>> {
  return request('/api/system/credit/package/sort/update', {
    method: 'POST',
    data,
  });
}

/**
 * 创建积分套餐
 */
export async function apiCreateCreditPackage(
  data: CreditPackageInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/credit/package/create', {
    method: 'POST',
    data,
  });
}

/**
 * 查询积分套餐列表
 */
export async function apiGetCreditPackageList(
  status?: number,
): Promise<RequestResponse<CreditPackageInfo[]>> {
  return request('/api/system/credit/package/list', {
    method: 'GET',
    params: {
      status,
    },
  });
}

/**
 * 积分扣减
 */
export async function apiSystemDeductCredit(
  data: DeductCreditParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/credit/deduct', {
    method: 'POST',
    data,
  });
}

/**
 * 积分发放
 */
export async function apiSystemAddCredit(
  data: AddCreditParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/credit/add', {
    method: 'POST',
    data,
  });
}

/**
 * 用户积分查询
 */
export async function apiGetCreditSummaryList(
  params: UserCreditSummarySearchParams,
): Promise<RequestResponse<PageNum<UserCreditSummaryInfo>>> {
  return request('/api/system/credit/summary/list', {
    method: 'GET',
    params,
  });
}

/**
 * 查询用户积分流水明细，传入lastId翻页
 */
export async function apiGetCreditFlowList(
  params: UserCreditFlowSearchParams,
): Promise<RequestResponse<UserCreditFlowInfo[]>> {
  return request('/api/system/credit/flow/list', {
    method: 'GET',
    params,
  });
}
