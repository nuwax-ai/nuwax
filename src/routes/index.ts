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
  { path: '/', redirect: '/home' },
  {
    path: '',
    component: '@/layouts/index',
    layout: false,
    routes: [
      { path: '/home', component: '@/pages/Home' },
      { path: '/home/chat', component: '@/pages/Chat' },
      { path: '/space', component: '@/pages/Space' },
      { path: '/square', component: '@/pages/Square' },
    ],
  },
  { path: '/antv', component: '@/pages/Antv-X6', layout: false },
  {
    path: '/edit-agent',
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
