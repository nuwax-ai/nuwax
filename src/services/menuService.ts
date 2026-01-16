/**
 * 菜单服务 API
 * @description 动态菜单相关的接口请求
 */
import type { MenuQueryResponse } from '@/types/interfaces/menu';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * 查询用户菜单及功能权限
 * 返回当前用户有权限访问的菜单树和功能权限列表
 */
export async function apiQueryMenus(): Promise<
  RequestResponse<MenuQueryResponse>
> {
  return request('/api/system/menu/list', {
    method: 'GET',
  });
}
