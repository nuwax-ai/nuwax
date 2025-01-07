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
    path: '',
    component: '@/layouts/index',
    layout: false,
    routes: [
      { path: '/', component: '@/pages/Home' },
      { path: '/home/chat', component: '@/pages/Chat' },
      { path: '/space', component: '@/pages/Space' },
    ],
  },
  { path: '/antv', component: '@/pages/Antv-X6', layout: false },
  {
    path: '/*',
    component: '@/pages/404',
    layout: false,
  },
];

export default routes;
