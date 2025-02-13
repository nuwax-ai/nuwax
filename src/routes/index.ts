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
    // wrappers: ['@/wrappers/auth'],
    layout: false,
    routes: [
      { path: '', component: '@/pages/Home' },
      { path: '/home/chat', component: '@/pages/Chat' },
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
    ],
  },
  { path: '/antv', component: '@/pages/Antv-X6', layout: false },
  {
    path: '/space/:spaceId/agent/:agentId',
    component: '@/pages/EditAgent',
    layout: false,
  },
  {
    path: '/*',
    component: '@/pages/404',
    layout: false,
  },
];

export default routes;
