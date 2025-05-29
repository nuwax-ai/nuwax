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
    // wrappers: ['@/wrappers/auth'],
    layout: false,
    routes: [
      { path: '', component: '@/pages/Home' },
      { path: '/home/chat/:id/:agentId', component: '@/pages/Chat' },
      { path: '/home/log/:agentId', component: '@/pages/HomeLog' },
      { path: '/agent/:agentId', component: '@/pages/AgentDetails' },
      { path: '/space', component: '@/pages/Space' },
      { path: '/space/:spaceId/develop', component: '@/pages/SpaceDevelop' },
      { path: '/space/:spaceId/library', component: '@/pages/SpaceLibrary' },
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
      { path: '/system/user/manage', component: '@/pages/UserManage' },
      {
        path: '/system/model/manage',
        component: '@/pages/GlobalModelManage',
      },
    ],
  },
  {
    path: '/space/:spaceId/workflow/:workflowId',
    component: '@/pages/Antv-X6',
    // wrappers: ['@/wrappers/auth'],
    layout: false,
  },
  {
    path: '/space/:spaceId/agent/:agentId',
    component: '@/pages/EditAgent',
    // wrappers: ['@/wrappers/auth'],
    layout: false,
  },
  {
    path: '/*',
    component: '@/pages/404',
    layout: false,
  },
];

export default routes;
