/**
 * 积分套餐
 */

import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import { CreditPackageInfo, CreditPackageSortItem } from '../types/credit';

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
