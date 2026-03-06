/**
 * 路由鉴权 Wrapper
 * @description 用于在路由层面控制页面访问权限，无需修改页面组件代码
 */
import NoPermissionPage from '@/pages/403';
import React from 'react';
import { Outlet, useModel, useRouteData } from 'umi';

const PermissionRoute: React.FC = () => {
  // 获取当前路由配置信息
  const route = useRouteData().route;
  const { hasPermission, loading } = useModel('menuModel');

  // 如果正在加载权限，可以显示 loading 或者暂时允许通过
  if (loading) {
    return null;
  }

  // 获取路由配置中定义的需要的权限
  // 在 routes/index.ts 中配置: { path: '/foo', wrapper: '@/wrappers/PermissionRoute', code: 'user:view' }
  const requiredPermissionCode = (route as any).code;

  if (requiredPermissionCode && !hasPermission(requiredPermissionCode)) {
    // 无权限，直接渲染 403 页面，保持 URL 不变
    // 这样用户可以知道自己访问的是哪个链接被拒绝了
    return <NoPermissionPage />;
  }

  return <Outlet />;
};

export default PermissionRoute;
