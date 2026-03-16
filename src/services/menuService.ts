/**
 * 菜单服务 API
 * @description 动态菜单相关的接口请求
 */
import { SUCCESS_CODE } from '@/constants/codes.constants';
import type { MenuItemDto } from '@/types/interfaces/menu';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * 转换后端菜单格式为前端所需格式
 * 菜单代码到本地图标名称的映射
 */
const MENU_ICON_MAP: Record<string, string> = {
  // 一级菜单
  new_conversation: 'icons-nav-new_chat',
  // 主页
  homepage: 'icons-nav-home',
  // 工作空间
  workspace: 'icons-nav-workspace',
  // 系统广场
  system_square: 'icons-nav-square',
  // 生态市场
  eco_market: 'icons-nav-ecosystem',
  // 系统管理
  system_manage: 'icons-nav-settings',

  // 用户操作区域
  documents: 'icons-nav-doc',
  notification: 'icons-nav-notification',
  my_computer: 'icons-nav-computer',

  // 二级菜单 - 系统管理
  // 用户管理
  user_manage: 'icons-nav-user',
  // 发布审核
  publish_audit: 'icons-nav-publish_audit',
  // 已发布管理
  published_manage: 'icons-nav-publish_manage',
  // 公共模型管理
  model_manage: 'icons-nav-model',
  // 系统配置
  system_config: 'icons-nav-settings',
  // 系统概览
  system_dashboard: 'icons-nav-dashboard',
  // 任务管理
  system_task_manage: 'icons-nav-task-time',
  // 菜单权限
  permission_manage: 'icons-nav-permission',
  // 日志查询
  system_log_query: 'icons-nav-log',
  // 内容管理
  content_manage: 'icons-nav-cube',

  // 二级菜单 - 工作空间
  // 智能体开发
  agent_dev: 'icons-nav-stars',
  // 网页应用开发"
  page_app_dev: 'icons-common-console',
  // 组件库
  component_lib_dev: 'icons-nav-components',
  // 技能管理
  skill_dev: 'icons-nav-skill',
  // MCP管理
  mcp_dev: 'icons-nav-mcp',
  // 任务中心
  space_task_dev: 'icons-nav-task-time',
  // 日志查询
  space_log_query: 'icons-chat-history',
  // 空间广场
  space_square: 'icons-nav-space_square',
  // 成员与设置
  member_setting: 'icons-nav-settings',
  // IM 机器人
  im_channel: 'icons-nav-computer',

  // Adding leftovers from logs or standard mapping
  component_dev: 'icons-nav-cube',
  log_manage: 'icons-nav-log', // Captured: log_manage
};

// 是否使用本地图标映射 (Configurable Strategy)
// const USE_LOCAL_ICON_MAPPING = true;

/**
 * 转换后端菜单格式为前端所需格式
 */
function mapSysMenuToMenuItem(sysMenus: any[]): MenuItemDto[] {
  return sysMenus.map((item) => ({
    ...item,
    // Debug log for code mapping
    // _debug: console.log(
    //   `[MenuMap] Name: ${item.name}, Code: ${item.code}, Icon: ${item.icon}`,
    // ),
    // 根据策略决定是否优先使用本地映射的图标
    icon: MENU_ICON_MAP[item.code] || item.icon,
    // sortIndex: item.sortIndex, // 映射排序字段
    children: item.children ? mapSysMenuToMenuItem(item.children) : [],
    // permissions: item.resourceTree ? mapSysMenuToMenuItem(item.resourceTree) : [],
  }));
}

// 查询用户的菜单权限（树形结构）
export async function apiQueryUserMenu(): Promise<
  RequestResponse<MenuItemDto[]>
> {
  return request('/api/user/list-menu', {
    method: 'GET',
  });
}

/**
 * 查询用户菜单及功能权限
 * 返回当前用户有权限访问的菜单树和功能权限列表
 * @param userId 用户ID
 */
export async function apiQueryMenus(): Promise<RequestResponse<MenuItemDto[]>> {
  // 调用真实接口
  const res = await apiQueryUserMenu();

  // 转换数据结构以适配前端模型
  if (res?.code === SUCCESS_CODE && Array.isArray(res?.data)) {
    const mappedMenus = mapSysMenuToMenuItem(res.data);
    // 替换默认图标映射
    return {
      ...res,
      data: mappedMenus,
    };
  }

  return res;
}
