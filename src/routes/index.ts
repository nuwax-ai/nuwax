const routes = [
  {
    path: '/login',
    component: '@/pages/Login',
    layout: false,
  },
  {
    path: '',
    component: '@/layouts/index',
    layout: false,
    routes: [{ path: '/', component: '@/pages/Home' }, { path: '/space', component: '@/pages/Space' }],
  },
  {
    path: '/*',
    component: '@/pages/404',
    layout: false,
  },
];

export default routes;