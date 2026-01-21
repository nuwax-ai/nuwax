/**
 * 菜单服务 API
 * @description 动态菜单相关的接口请求
 */
import type { MenuItemDto, MenuQueryResponse } from '@/types/interfaces/menu';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// ... (MOCK_MENU_DATA remains for reference or fallback if needed, but usually we can leave it)

/**
 * 转换后端菜单格式为前端所需格式
 */
function mapSysMenuToMenuItem(sysMenus: any[]): MenuItemDto[] {
  return sysMenus.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    icon: item.icon,
    path: item.path,
    type: 'menu', // 默认为菜单，因为后端未返回类型
    sortOrder: item.sortIndex, // 映射排序字段
    children: item.children ? mapSysMenuToMenuItem(item.children) : [],
    permissions: [], // 后端目前未返回功能权限
    description: item.description,
    source: item.source,
    parentId: item.parentId,
    visible: item.visible,
    creator: item.creator,
    created: item.created,
    modifierId: item.modifierId,
    modifier: item.modifier,
    modified: item.modified,
  }));
}

/**
 * 查询用户菜单及功能权限
 * 返回当前用户有权限访问的菜单树和功能权限列表
 * @param userId 用户ID
 */
export async function apiQueryMenus(
  userId: number | string,
): Promise<RequestResponse<MenuQueryResponse>> {
  // 使用 Mock 数据
  // if (USE_MOCK_DATA) {
  //   return Promise.resolve({
  //     code: 0,
  //     message: 'success',
  //     data: {
  //       menus: [],
  //     },
  //   });
  // }

  // 调用真实接口
  const res = await request(`/api/system/user/list-menu/${userId}`, {
    method: 'GET',
  });

  // 转换数据结构以适配前端模型
  if (res && res.code === '0000' && Array.isArray(res.data)) {
    // 构造前端需要的响应结构
    return {
      ...res,
      code: 0, // 转换状态码 (通常 api 成功是 0000 -> 0 或根据 request 封装)
      data: {
        menus: mapSysMenuToMenuItem(res.data),
      },
    };
  }

  return res;
}
