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
// 菜单代码到本地图标名称的映射
// 菜单代码到本地图标名称的映射
// 菜单代码到本地图标名称的映射
const MENU_ICON_MAP: Record<string, string> = {
  // 一级菜单
  new_chat: 'icons-nav-new_chat',
  homepage: 'icons-nav-home', // Captured: homepage
  workspace: 'icons-nav-workspace', // Captured: workspace
  square: 'icons-nav-square', // Captured: square
  eco_market: 'icons-nav-ecosystem', // Captured: eco_market
  sys_manage: 'icons-nav-settings', // Captured: sys_manage

  // 二级菜单 - 系统管理
  sys_user_manage: 'icons-nav-user', // Captured: sys_user_manage
  sys_publish_manage: 'icons-nav-publish_audit', // Captured: sys_publish_manage (Using publish_audit icon)
  sys_publish_approve: 'icons-nav-publish_audit', // Captured: sys_publish_approve
  sys_published: 'icons-nav-template', // Captured: sys_published
  sys_model_manage: 'icons-nav-template', // Captured: sys_model_manage
  // 'system_config': 'icons-nav-settings', // Not seen in captured logs, keeping just in case or mapping to sys_manage if strictly mapped?
  // 'theme_config': 'icons-nav-palette',
  // 'dashboard': 'icons-nav-dashboard',
  sys_menu_permission: 'icons-nav-permission', // Guessing sys_ prefix based on others if not seen, or wait, I saw 'menu_permission' in constants but logs might differ.
  // Actually logs didn't show menu_permission, but I should be careful.
  // Let's add the ones I SAW in logs explicitly.

  // Adding leftovers from logs or standard mapping
  agent_dev: 'icons-nav-cube',
  page_app_dev: 'icons-nav-cube',
  component_dev: 'icons-nav-cube',
  skill_dev: 'icons-nav-cube',
  mcp_dev: 'icons-nav-cube',
  task_manage: 'icons-nav-cube',
  log_manage: 'icons-nav-log', // Captured: log_manage
  space_square: 'icons-nav-square', // Captured: space_square
};

// 是否使用本地图标映射 (Configurable Strategy)
const USE_LOCAL_ICON_MAPPING = true;

/**
 * 转换后端菜单格式为前端所需格式
 */
function mapSysMenuToMenuItem(sysMenus: any[]): MenuItemDto[] {
  return sysMenus.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    // Debug log for code mapping
    _debug: console.log(
      `[MenuMap] Name: ${item.name}, Code: ${item.code}, Icon: ${item.icon}`,
    ),
    // 根据策略决定是否优先使用本地映射的图标
    icon: USE_LOCAL_ICON_MAPPING
      ? MENU_ICON_MAP[item.code] || item.icon
      : item.icon,
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
export async function apiQueryMenus(): Promise<
  RequestResponse<MenuQueryResponse>
> {
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
  const res = await request(`/api/user/list-menu`, {
    method: 'GET',
  });

  console.log('[Debug] Menu Response:', res);
  // 转换数据结构以适配前端模型
  if (
    res &&
    (res.code === '0000' || res.code === 0) &&
    Array.isArray(res.data)
  ) {
    console.log('[Debug] Mapping menus...');
    const mappedMenus = mapSysMenuToMenuItem(res.data);
    console.log('[Debug] Mapped Menus:', mappedMenus);
    // 构造前端需要的响应结构
    return {
      ...res,
      code: 0, // 转换状态码 (通常 api 成功是 0000 -> 0 或根据 request 封装)
      data: {
        menus: mappedMenus,
      },
    };
  }

  console.warn('[Debug] Menu Response Validation Failed:', res);
  return res;
}
