const routes = [
  {
    path: '/login',
    component: '@/pages/Login',
    layout: false,
  },
  {
    path: '/verify-code',
    component: '@/pages/VerifyCode',
    layout: false,
  },
  {
    path: '/set-password',
    component: '@/pages/SetPassword',
    layout: false,
  },
  {
    path: '/chat-temp/:chatKey',
    component: '@/pages/ChatTemp',
    layout: false,
  },
  {
    path: '/',
    component: '@/layouts',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
    routes: [
      { path: '', component: '@/pages/Home' },
      { path: '/home/chat/:id/:agentId', component: '@/pages/Chat' },
      { path: '/agent/:agentId', component: '@/pages/AgentDetails' },
      { path: '/space', component: '@/pages/Space' },
      { path: '/space/:spaceId/develop', component: '@/pages/SpaceDevelop' },
      {
        path: '/space/:spaceId/page-develop',
        component: '@/pages/SpacePageDevelop',
      },
      { path: '/space/:spaceId/:agentId/log', component: '@/pages/SpaceLog' },
      { path: '/space/:spaceId/library', component: '@/pages/SpaceLibrary' },
      { path: '/space/:spaceId/mcp', component: '@/pages/SpaceMcpManage' },
      {
        path: '/space/:spaceId/mcp/create',
        component: '@/pages/SpaceMcpCreate',
      },
      {
        path: '/space/:spaceId/mcp/edit/:mcpId',
        component: '@/pages/SpaceMcpEdit',
      },
      {
        path: '/space/:spaceId/space-square',
        component: '@/pages/SpaceSquare',
      },
      { path: '/space/:spaceId/team', component: '@/pages/TeamSetting' },
      {
        path: '/space/:spaceId/plugin/:pluginId',
        component: '@/pages/SpacePluginTool',
      },
      {
        path: '/space/:spaceId/plugin/:pluginId/cloud-tool',
        component: '@/pages/SpacePluginCloudTool',
      },
      {
        path: '/space/:spaceId/knowledge/:knowledgeId',
        component: '@/pages/SpaceKnowledge',
      },
      {
        path: '/space/:spaceId/table/:tableId',
        component: '@/pages/SpaceTable',
      },

      { path: '/square', component: '@/pages/Square' },
      { path: '/system/publish/audit', component: '@/pages/PublishAudit' },
      {
        path: '/square/publish/plugin/:pluginId',
        component: '@/pages/Square/PluginDetail',
      },
      {
        path: '/square/publish/workflow/:workflowId',
        component: '@/pages/Square/WorkflowIdDetail',
      },
      {
        path: '/system/published/manage',
        component: '@/pages/PublishedManage',
      },
      { path: '/system/config', component: '@/pages/SystemConfig' },
      { path: '/system/theme/config', component: '@/pages/ThemeConfig' },
      { path: '/system/user/manage', component: '@/pages/UserManage' },
      {
        path: '/system/model/manage',
        component: '@/pages/GlobalModelManage',
      },
      // 生态市场
      {
        path: '/ecosystem',
        name: '生态市场',
        access: 'canAdmin',
        routes: [
          {
            path: '/ecosystem/plugin',
            name: '插件',
            component: '@/pages/EcosystemPlugin',
            access: 'canAdmin',
          },
          {
            path: '/ecosystem/template',
            name: '模板',
            component: '@/pages/EcosystemTemplate',
            access: 'canAdmin',
          },
          {
            path: '/ecosystem/mcp',
            name: 'MCP',
            component: '@/pages/EcosystemMcp',
            access: 'canAdmin',
          },
          {
            path: '/ecosystem',
            redirect: '/ecosystem/mcp',
          },
        ],
      },
    ],
  },
  {
    path: '/space/:spaceId/workflow/:workflowId',
    component: '@/pages/Antv-X6',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
  },
  {
    path: '/space/:spaceId/agent/:agentId',
    component: '@/pages/EditAgent',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
  },
  {
    path: '/*',
    component: '@/pages/404',
    layout: false,
  },
  {
    path: '/examples',
    component: '@/examples/index',
    layout: false,
  },
  {
    path: '/examples/antd-showcase',
    component: '@/examples/AntdComponentsShowcase',
    layout: false,
  },
  {
    path: '/examples/svg-icon-showcase',
    component: '@/examples/SvgIconShowcase',
    layout: false,
  },
];

export default routes;
