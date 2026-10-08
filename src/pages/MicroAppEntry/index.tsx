import useCommercialEdition from '@/hooks/useCommercialEdition';
import { microAppHostStore } from '@/layouts/MicroAppHost/store';
import { isWorkCommercialApp } from '@/utils/commercialEdition';
import { findMicroAppRoute } from '@/utils/microAppRoutes';
import { useLocation, useNavigate } from '@umijs/max';
import { useEffect } from 'react';

/** 路由仅控制持久宿主，微应用 DOM 由 SidebarShell 内的宿主容器承载。 */
const MicroAppEntry = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const app = findMicroAppRoute(pathname);
  const { workCommercialEdition } = useCommercialEdition();
  const blocked = isWorkCommercialApp(app?.name) && !workCommercialEdition;
  const isStableEntry =
    app !== undefined && pathname.replace(/\/+$/, '') === app.stableEntry;

  useEffect(() => {
    if (!app || blocked) return;
    if (isStableEntry) {
      navigate(`${app.path}${search}${hash}`, { replace: true });
      return;
    }
    const path = `${pathname}${search}${hash}`;
    const refreshToken = new URLSearchParams(search).get('_refresh') || '';
    const effectiveEntry = microAppHostStore.activate({
      name: app.name,
      path,
      refreshToken,
    });
    if (effectiveEntry) {
      const currentUrl = new URL(path, window.location.origin);
      const effectiveUrl = new URL(effectiveEntry.path, window.location.origin);
      currentUrl.searchParams.delete('_refresh');
      effectiveUrl.searchParams.delete('_refresh');
      if (
        `${effectiveUrl.pathname}${effectiveUrl.search}${effectiveUrl.hash}` !==
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
      ) {
        // 菜单裸入口恢复此前文档；地址栏跟随已保留的内部路由，并保留本次显式刷新。
        if (refreshToken)
          effectiveUrl.searchParams.set('_refresh', refreshToken);
        navigate(
          `${effectiveUrl.pathname}${effectiveUrl.search}${effectiveUrl.hash}`,
          { replace: true },
        );
      }
    }
  }, [app?.name, blocked, isStableEntry, pathname, search, hash, navigate]);

  useEffect(() => {
    if (!app || blocked || isStableEntry) return;
    return () => microAppHostStore.deactivate(app.name);
  }, [app?.name, blocked, isStableEntry]);

  return null;
};

export default MicroAppEntry;
