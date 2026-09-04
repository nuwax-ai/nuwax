/**
 * 侧栏折叠/展开 hook
 * @description 主导航改造（单栏模式）：折叠入口在侧栏顶栏 icon（展开态），
 * 折叠态在屏幕左缘显示悬浮展开按钮（见 DynamicMenusLayout）。
 * 偏好持久化沿用原 CollapseButton 的 sessionStorage key，老用户偏好兼容。
 */
import { isImmersiveShell } from '@/utils/nuwaClawBridge';
import { useCallback, useEffect } from 'react';
import { useModel, useSearchParams } from 'umi';

/** 折叠偏好存储 key（原 CollapseButton 沿用） */
export const COLLAPSE_STORAGE_KEY = 'menu-collapsed-user-preference';

export const useSidebarCollapse = () => {
  const { isSecondMenuCollapsed, setIsSecondMenuCollapsed } =
    useModel('layout');
  const [searchParams] = useSearchParams();

  // 折叠偏好初始化：用户操作 > URL hideMenu > 默认展开；
  // 桌面端沉浸式收起能力在 nuwaclaw 原生工具栏，跳过初始化
  useEffect(() => {
    if (isImmersiveShell()) return;
    try {
      const raw = sessionStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved.collapsed === 'boolean') {
          setIsSecondMenuCollapsed(saved.collapsed);
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to read menu preference:', error);
    }
    if (searchParams.get('hideMenu') === 'true') {
      setIsSecondMenuCollapsed(true);
      return;
    }
    setIsSecondMenuCollapsed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.pathname]);

  /** 折叠/展开：保存用户偏好到 sessionStorage */
  const toggleCollapse = useCallback(() => {
    const next = !isSecondMenuCollapsed;
    try {
      if (next) {
        sessionStorage.setItem(
          COLLAPSE_STORAGE_KEY,
          JSON.stringify({ collapsed: true, timestamp: Date.now() }),
        );
      } else {
        sessionStorage.removeItem(COLLAPSE_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to save menu preference:', error);
    }
    setIsSecondMenuCollapsed(next);
  }, [isSecondMenuCollapsed, setIsSecondMenuCollapsed]);

  return { isSecondMenuCollapsed, toggleCollapse };
};
