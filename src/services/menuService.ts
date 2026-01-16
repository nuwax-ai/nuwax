/**
 * 菜单服务 API
 * @description 动态菜单相关的接口请求
 */
import type { MenuItemDto, MenuQueryResponse } from '@/types/interfaces/menu';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * 是否使用 Mock 数据
 * 当后端接口未实现时设置为 true
 */
const USE_MOCK_DATA = true;

/**
 * Mock 菜单数据
 * 展示三级菜单结构和功能权限
 */
const MOCK_MENU_DATA: MenuItemDto[] = [
  {
    id: 1,
    name: '主页',
    code: 'home',
    icon: 'icons-nav-home',
    path: '/',
    type: 'menu',
    sortOrder: 1,
    children: [
      {
        id: 11,
        name: '概览',
        code: 'home_overview',
        icon: 'icons-nav-home',
        path: '/home/overview',
        type: 'menu',
        sortOrder: 1,
        children: [],
        permissions: [],
      },
    ],
    permissions: [],
  },
  {
    id: 2,
    name: '工作空间',
    code: 'space',
    icon: 'icons-nav-workspace',
    path: '/space',
    type: 'menu',
    sortOrder: 2,
    children: [
      {
        id: 21,
        name: '我的应用',
        code: 'my_apps',
        icon: 'icons-nav-app',
        path: '/space/apps',
        type: 'menu',
        sortOrder: 1,
        children: [],
        permissions: [],
      },
      {
        id: 22,
        name: '我的插件',
        code: 'my_plugins',
        icon: 'icons-nav-plugin',
        path: '/space/plugins',
        type: 'menu',
        sortOrder: 2,
        children: [],
        permissions: [],
      },
    ],
    permissions: [],
  },
  {
    id: 3,
    name: '广场',
    code: 'square',
    icon: 'icons-nav-square',
    path: '/square',
    type: 'menu',
    sortOrder: 3,
    children: [
      {
        id: 301,
        name: '智能体',
        code: 'square_agent',
        icon: 'icons-nav-stars',
        path: '/square?cate_type=Agent',
        type: 'menu',
        sortOrder: 1,
        children: [
          {
            id: 30101,
            name: '热门',
            code: 'square_agent_hot',
            path: '/square?cate_type=Agent&cate_name=Hot',
            type: 'menu',
            children: [],
            permissions: [],
          },
          {
            id: 30102,
            name: '助手',
            code: 'square_agent_assistant',
            path: '/square?cate_type=Agent&cate_name=Assistant',
            type: 'menu',
            children: [],
            permissions: [],
          },
        ],
        permissions: [],
      },
      {
        id: 302,
        name: '插件',
        code: 'square_plugin',
        icon: 'icons-nav-plugins',
        path: '/square?cate_type=Plugin',
        type: 'menu',
        sortOrder: 2,
        children: [
          {
            id: 30201,
            name: '工具',
            code: 'square_plugin_tool',
            path: '/square?cate_type=Plugin&cate_name=Tool',
            type: 'menu',
            children: [],
            permissions: [],
          },
        ],
        permissions: [],
      },
      {
        id: 303,
        name: '工作流',
        code: 'square_workflow',
        icon: 'icons-nav-workflow',
        path: '/square?cate_type=Workflow',
        type: 'menu',
        sortOrder: 3,
        children: [],
        permissions: [],
      },
      {
        id: 304,
        name: '模板',
        code: 'square_template',
        icon: 'icons-nav-template',
        path: '/square?cate_type=Template',
        type: 'menu',
        sortOrder: 4,
        children: [],
        permissions: [],
      },
    ],
    permissions: [],
  },
  {
    id: 4,
    name: '生态市场',
    code: 'ecosystem_market',
    icon: 'icons-nav-ecosystem',
    path: '/ecosystem',
    type: 'menu',
    sortOrder: 4,
    children: [
      {
        id: 401,
        name: 'MCP',
        code: 'ecosystem_mcp',
        icon: 'icons-nav-mcp',
        path: '/ecosystem/mcp',
        type: 'menu',
        sortOrder: 1,
        children: [],
        permissions: [],
      },
      {
        id: 402,
        name: '插件',
        code: 'ecosystem_plugin',
        icon: 'icons-nav-plugins',
        path: '/ecosystem/plugin',
        type: 'menu',
        sortOrder: 2,
        children: [],
        permissions: [],
      },
      {
        id: 403,
        name: '模板',
        code: 'ecosystem_template',
        icon: 'icons-nav-template',
        path: '/ecosystem/template',
        type: 'menu',
        sortOrder: 3,
        children: [
          {
            id: 40301,
            name: '智能体',
            code: 'ecosystem_template_agent',
            path: '/ecosystem/template?targetType=Agent',
            type: 'menu',
            children: [],
            permissions: [],
          },
          {
            id: 40302,
            name: '工作流',
            code: 'ecosystem_template_workflow',
            path: '/ecosystem/template?targetType=Workflow',
            type: 'menu',
            children: [],
            permissions: [],
          },
          {
            id: 40303,
            name: '网页应用',
            code: 'ecosystem_template_page',
            path: '/ecosystem/template?targetType=Page',
            type: 'menu',
            children: [],
            permissions: [],
          },
        ],
        permissions: [],
      },
    ],
    permissions: [],
  },
  {
    id: 5,
    name: '系统管理',
    code: 'system_manage',
    icon: 'icons-nav-settings',
    path: '/system/user/manage',
    type: 'menu',
    sortOrder: 5,
    children: [
      {
        id: 51,
        name: '用户管理',
        code: 'user_manage',
        icon: 'icons-nav-user',
        path: '/system/user/manage',
        type: 'menu',
        sortOrder: 1,
        children: [],
        permissions: [
          { code: 'user:add', name: '新增用户' },
          { code: 'user:edit', name: '编辑用户' },
          { code: 'user:delete', name: '删除用户' },
          { code: 'user:enable', name: '启用用户' },
          { code: 'user:disable', name: '禁用用户' },
        ],
      },
      {
        id: 52,
        name: '发布审核',
        code: 'publish_audit',
        icon: 'icons-nav-publish_audit',
        path: '/system/publish/audit',
        type: 'menu',
        sortOrder: 2,
        children: [],
        permissions: [
          { code: 'audit:approve', name: '审核通过' },
          { code: 'audit:reject', name: '审核拒绝' },
        ],
      },
      {
        id: 53,
        name: '已发布管理',
        code: 'published_manage',
        icon: 'icons-nav-template',
        path: '/system/published/manage',
        type: 'menu',
        sortOrder: 3,
        children: [],
        permissions: [{ code: 'publish:offline', name: '下架' }],
      },
      {
        id: 54,
        name: '公共模型管理',
        code: 'global_model_manage',
        icon: 'icons-nav-template',
        path: '/system/model/manage',
        type: 'menu',
        sortOrder: 4,
        children: [],
        permissions: [
          { code: 'model:add', name: '新增模型' },
          { code: 'model:edit', name: '编辑模型' },
          { code: 'model:delete', name: '删除模型' },
        ],
      },
      {
        id: 55,
        name: '系统配置',
        code: 'system_config',
        icon: 'icons-nav-settings',
        path: '/system/config',
        type: 'menu',
        sortOrder: 5,
        children: [],
        permissions: [{ code: 'config:edit', name: '编辑配置' }],
      },
      {
        id: 56,
        name: '主题配置',
        code: 'theme_config',
        icon: 'icons-nav-palette',
        path: '/system/theme/config',
        type: 'menu',
        sortOrder: 6,
        children: [],
        permissions: [{ code: 'theme:edit', name: '编辑主题' }],
      },
    ],
    permissions: [],
  },
];

/**
 * 查询用户菜单及功能权限
 * 返回当前用户有权限访问的菜单树和功能权限列表
 */
export async function apiQueryMenus(): Promise<
  RequestResponse<MenuQueryResponse>
> {
  // 使用 Mock 数据
  if (USE_MOCK_DATA) {
    return Promise.resolve({
      code: 0,
      message: 'success',
      data: {
        menus: MOCK_MENU_DATA,
      },
    });
  }

  // 调用真实接口
  return request('/api/system/menu/list', {
    method: 'GET',
  });
}
