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
  // 多语言管理
  i18n_manage: 'icons-nav-settings',
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
  // 推荐管理
  recommend_manage: 'icons-nav-recommend-manage',
  // 历史会话
  history_conversation: 'icons-nav-history-conversation',
  // 支付与收益（开发者）
  dev_payment_earnings: 'icons-nav-my-earnings',
  // 订阅与积分（管理员）
  admin_subscription_credits: 'icons-nav-subscription',
  // 模型监控
  model_monitor: 'icons-common-console',

  // 二级菜单 - 工作空间
  // 新建项目
  create_project: 'icons-common-plus',
  // 智能体开发
  agent_dev: 'icons-nav-stars',
  // 网页应用开发"
  page_app_dev: 'icons-common-console',
  // 组件库（保留兼容旧 code）
  component_lib_dev: 'icons-nav-cube',
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
  im_channel: 'icons-nav-robot',

  // 组件资源子菜单
  // 插件与工作流
  plugin_workflow_dev: 'icons-nav-cube',
  // 知识与数据存储
  knowledge_storage_dev: 'icons-nav-knowledge',
  // 模型管理（工作空间级别）
  space_model_manage: 'icons-nav-model',

  // 智能体用户订阅
  agent_subscription: 'icons-nav-subscription',

  // Adding leftovers from logs or standard mapping
  component_dev: 'icons-nav-cube',
  log_manage: 'icons-nav-log', // Captured: log_manage

  // 更多
  api_key: 'icons-nav-api_key',
  // 更多页面 - 我的订阅
  my_subscriptions: 'icons-nav-wodedingyue',
  model_permissions: 'icons-nav-model',
  // 更多页面 - 我的订单
  my_orders: 'icons-nav-wodedingdan',
  // 更多页面 - 我的收益
  my_earnings: 'icons-nav-wodeshouyi',
  // 更多页面 - 用量统计
  usage_statistics: 'icons-nav-yongliangtongji',
  resource_pricing: 'icons-nav-ziyuandingjia',
  subscription_and_points: 'icons-nav-dingyueyujifen',
  pay_and_earnings: 'icons-nav-zhifuyushouyi',

  // 系统管理 - 支付与收益子菜单
  payment_config: 'icons-nav-settings',
  payment_merchant_info: 'icons-nav-info',
  dev_payment_info: 'icons-nav-earnings',
  dev_earnings_stats: 'icons-nav-chart',
  dev_withdrawal: 'icons-nav-withdraw',
  payment_orders: 'icons-nav-orders',

  // 系统管理 - 订阅与积分子菜单
  subs_basic_config: 'icons-nav-settings',
  subs_plans: 'icons-nav-subscription',
  credits_packages: 'icons-nav-credits',
  user_credits_query: 'icons-nav-user',
  credits_records_query: 'icons-nav-history',
  subs_orders: 'icons-nav-orders',
};

/**
 * 转换后端菜单格式为前端所需格式
 */
function mapSysMenuToMenuItem(sysMenus: any[]): MenuItemDto[] {
  return sysMenus.map((item) => ({
    ...item,
    /**
     * 如果菜单项的图标为空，则使用本地图标映射
     * 如果菜单项的图标不为空，则使用菜单项的图标，优先级高于本地图标映射
     */
    icon: item.icon || MENU_ICON_MAP[item.code],
    children: item.children ? mapSysMenuToMenuItem(item.children) : [],
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
