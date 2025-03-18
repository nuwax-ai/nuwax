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
    path: '/',
    component: '@/layouts',
    wrappers: ['@/wrappers/auth'],
    layout: false,
    routes: [
      { path: '', component: '@/pages/Home' },
      { path: '/home/chat/:id', component: '@/pages/Chat' },
      { path: '/space/:spaceId/develop', component: '@/pages/SpaceDevelop' },
      { path: '/space/:spaceId/library', component: '@/pages/SpaceLibrary' },
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
      { path: '/square', component: '@/pages/Square' },
      { path: '/system/publish/audit', component: '@/pages/PublishAudit' },
      {
        path: '/system/published/manage',
        component: '@/pages/PublishedManage',
      },
      { path: '/system/system/config', component: '@/pages/SystemConfig' },
      { path: '/system/user/manage', component: '@/pages/UserManage' },
      {
        path: '/system/global/model/manage',
        component: '@/pages/GlobalModelManage',
      },
    ],
  },
  {
    path: '/workflow/:workflowId',
    component: '@/pages/Antv-X6',
    wrappers: ['@/wrappers/auth'],
    layout: false,
  },
  {
    path: '/space/:spaceId/agent/:agentId',
    component: '@/pages/EditAgent',
    wrappers: ['@/wrappers/auth'],
    layout: false,
  },
  {
    path: '/*',
    component: '@/pages/404',
    layout: false,
  },
];

export default routes;
