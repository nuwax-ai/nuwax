/**
 * ProComponents 自定义工具方法
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import type { RequestResponse } from '@/types/interfaces/request';

/**
 * 创建 ProTable 列 request 的工具函数
 * @param fetchFn 获取选项数据的接口函数
 * @param transform 可选的数据转换函数
 */
export const createOptionsRequest = <T>(
  fetchFn: () => Promise<RequestResponse<T[]>>,
  transform?: (data: T[]) => { value: string; label: string }[],
) => {
  return async () => {
    try {
      const { code, data } = await fetchFn();
      if (code === SUCCESS_CODE && data) {
        return transform ? transform(data) : data;
      }
      return [];
    } catch (error) {
      console.error('获取选项数据失败', error);
      return [];
    }
  };
};
