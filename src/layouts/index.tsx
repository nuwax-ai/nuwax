import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'umi';
import HistoryConversation from './HistoryConversation';
import styles from './index.less';
import MenusLayout from './MenusLayout';
import Message from './Message';
import MobileMenu from './MobileMenu';
import Setting from './Setting';

// 绑定 classNames，便于动态样式组合
const cx = classNames.bind(styles);

/**
 * Layout 主布局组件
 * 负责响应式菜单、历史会话、消息、设置弹窗的布局与展示
 */
const Layout: React.FC = () => {
  // 是否为移动端
  const [isMobile, setIsMobile] = useState<boolean>(false);
  // 移动端菜单是否完全展开
  const [fullMobileMenu, setFullMobileMenu] = useState<boolean>(false);

  /**
   * 切换移动端菜单展开/收起
   * 使用 useCallback 优化，避免不必要的重渲染
   */
  const toggleFullMobileMenu = useCallback(() => {
    setFullMobileMenu((prev) => !prev);
  }, []);

  /**
   * 监听窗口尺寸变化，判断是否为移动端
   * 仅在组件挂载时绑定一次
   */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化判断
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * 控制移动端菜单平移动画
   * 监听 fullMobileMenu 和 isMobile 状态
   */
  useEffect(() => {
    const mobileMenuContainer = document.getElementById(
      'mobile-menu-container',
    );
    if (isMobile && mobileMenuContainer) {
      mobileMenuContainer.style.transform = fullMobileMenu
        ? 'translateX(0)'
        : 'translateX(-274px)';
    } else if (mobileMenuContainer) {
      mobileMenuContainer.style.transform = 'none';
    }
  }, [fullMobileMenu, isMobile]);

  // 侧边栏样式，使用 useMemo 优化
  const sidebarStyle = useMemo<React.CSSProperties>(
    () =>
      isMobile
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transition: 'transform 0.3s ease-in-out',
            zIndex: 999,
          }
        : {
            position: 'relative',
            width: 274,
            height: '100%',
          },
    [isMobile],
  );

  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      {/* 侧边菜单栏及弹窗区域 */}
      <div
        className={cx('flex', 'h-full')}
        id="mobile-menu-container"
        style={sidebarStyle}
      >
        {/* 菜单栏 */}
        <MenusLayout
          overrideContainerStyle={isMobile ? { paddingTop: 32 } : {}}
        />
        {/* 历史会话记录弹窗 */}
        <HistoryConversation />
        {/* 消息弹窗 */}
        <Message />
        {/* 设置弹窗 */}
        <Setting />
        {/* 移动端菜单按钮和遮罩层 */}
        {isMobile && (
          <MobileMenu isOpen={fullMobileMenu} onToggle={toggleFullMobileMenu} />
        )}
      </div>
      {/* 主内容区 */}
      <div className={cx('flex-1', 'overflow-y')}>
        {/* 页面内容 */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
