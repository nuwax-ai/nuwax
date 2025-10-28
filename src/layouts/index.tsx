import {
  ANIMATION_DURATION,
  MOBILE_BREAKPOINT,
  MOBILE_MENU_TOP_PADDING,
} from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { theme } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Outlet, useModel } from 'umi';
import HistoryConversation from './HistoryConversation';
import HoverMenu from './HoverMenu';
import styles from './index.less';
import MenusLayout from './MenusLayout';
import Message from './Message';
import MobileMenu from './MobileMenu';
import Setting from './Setting';

// 绑定 classNames，便于动态样式组合
const cx = classNames.bind(styles);

// 开发环境判断
// const isDev = process.env.NODE_ENV === 'development';
// const isDevOrTest = isDev || process.env.CI;

/**
 * Layout 主布局组件
 * 负责响应式菜单、历史会话、消息、设置弹窗的布局与展示
 */
const Layout: React.FC = () => {
  // 使用 useRef 避免重复获取 DOM 元素
  const mobileMenuContainerRef = useRef<HTMLDivElement>(null);
  // 全局主题与语言（已在 app.tsx 统一注入，这里仅保留使用场景需要时可读取）
  // const {
  //   language,
  //   toggleTheme,
  //   toggleLanguage,
  //   primaryColor,
  //   setPrimaryColor,
  //   isDarkMode,
  //   backgroundImageId,
  //   setBackgroundImage,
  // } = useGlobalSettings();

  // 导航风格管理（使用统一主题系统）
  const { navigationStyle, layoutStyle } = useUnifiedTheme();
  const { isSecondMenuCollapsed } = useModel('layout');
  const { token } = theme.useToken();

  // 状态管理
  const {
    isMobile,
    setIsMobile,
    realHidden,
    setRealHidden,
    fullMobileMenu,
    setFullMobileMenu,
    getCurrentMenuWidth,
  } = useModel('layout');

  // 移除对 @@initialState 的依赖，统一由 useGlobalSettings 管理全局配置

  /**
   * 检查是否为移动端设备
   * 使用 useCallback 优化，避免重复创建函数
   */
  const checkIsMobile = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  /**
   * 切换移动端菜单展开/收起
   * 使用 useCallback 优化，避免不必要的重渲染
   */
  const toggleFullMobileMenu = useCallback(() => {
    setFullMobileMenu((prev: boolean) => {
      const newState = !prev;
      // 展开时立即设置为非隐藏状态
      if (newState) {
        setRealHidden(false);
      }
      return newState;
    });
  }, []);

  /**
   * 处理动画完成事件
   * 使用 useCallback 优化，避免重复创建函数
   */
  const handleTransitionEnd = useCallback(
    (event: TransitionEvent) => {
      // 确保是 transform 属性的动画完成
      if (event.propertyName === 'transform' && !fullMobileMenu) {
        setRealHidden(true);
      }
    },
    [fullMobileMenu],
  );

  /**
   * 监听窗口尺寸变化，判断是否为移动端
   * 使用防抖优化性能
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkIsMobile, 100); // 100ms 防抖
    };

    window.addEventListener('resize', handleResize);
    checkIsMobile(); // 初始化判断

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [checkIsMobile]);

  /**
   * 控制移动端菜单平移动画
   * 监听 fullMobileMenu 和 isMobile 状态
   * 使用 transitionend 事件监听动画完成
   */
  useEffect(() => {
    const container = mobileMenuContainerRef.current;

    if (!container) return;

    if (isMobile) {
      // 添加动画完成监听器
      container.addEventListener('transitionend', handleTransitionEnd);

      // 设置动画样式
      container.style.transform = fullMobileMenu
        ? 'translateX(0)'
        : `translateX(-${getCurrentMenuWidth()}px)`;

      // 清理函数
      return () => {
        container.removeEventListener('transitionend', handleTransitionEnd);
      };
    } else {
      // 非移动端时重置样式和状态
      container.style.transform = 'none';
      setRealHidden(false);
      setFullMobileMenu(false); // 重置菜单状态
    }
  }, [fullMobileMenu, isMobile, handleTransitionEnd, getCurrentMenuWidth]);

  /**
   * 侧边栏样式配置
   * 使用 useMemo 优化，避免不必要的重新计算
   */
  const sidebarStyle = useMemo<React.CSSProperties>(() => {
    if (isMobile) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
        zIndex: 999,
        pointerEvents: 'auto',
        ...({
          ['--xagi-layout-second-menu-text-color']: token.colorText, // 悬浮菜单文字颜色 覆写
          ['--xagi-layout-second-menu-text-color-secondary']:
            token.colorTextSecondary, // 悬浮菜单文字颜色 覆写
        } as React.CSSProperties),
      };
    }

    return {
      position: 'relative',
      height: '100%',
    };
  }, [isMobile]);

  /**
   * 菜单栏容器样式类名
   * 使用 useMemo 优化
   */
  const containerClassName = useMemo(
    () =>
      cx(
        'flex',
        'h-full',
        realHidden && styles['mobile-menu-container-hidden'],
      ),
    [realHidden],
  );

  /**
   * 菜单栏覆盖样式
   * 使用 useMemo 优化
   */
  const menuOverrideStyle = useMemo(
    () => (isMobile ? { paddingTop: MOBILE_MENU_TOP_PADDING } : {}),
    [isMobile],
  );
  /**
   * 主容器样式类名（使用独立的布局风格类）
   * 包含导航风格和布局风格类
   */
  const mainContainerClassName = useMemo(
    () =>
      cx(
        'flex',
        'h-full',
        styles.container,
        `xagi-layout-${layoutStyle}`, // 布局风格类（独立于Ant Design）
        `xagi-nav-${navigationStyle}`, // 导航风格类
      ),
    [layoutStyle, navigationStyle],
  );

  /**
   * 页面容器样式类名（使用独立的布局风格类）
   * 根据导航风格动态调整
   */
  const pageContainerClassName = useMemo(
    () =>
      cx(
        'flex-1',
        styles[
          `xagi-layout-${isSecondMenuCollapsed ? 'collapsed' : 'expanded'}`
        ],
        styles['page-container'],
        styles[`xagi-layout-${layoutStyle}`],
        styles[`xagi-nav-${navigationStyle}`],
      ),
    [layoutStyle, navigationStyle, isSecondMenuCollapsed],
  );

  return (
    <div className={mainContainerClassName}>
      {/* 侧边菜单栏及弹窗区域 */}
      <div
        ref={mobileMenuContainerRef}
        className={containerClassName}
        id="mobile-menu-container"
        style={sidebarStyle}
      >
        {/* 菜单栏 */}
        <MenusLayout
          overrideContainerStyle={menuOverrideStyle}
          isMobile={isMobile}
        />

        {/* 悬浮菜单 */}
        <HoverMenu />

        {/* 历史会话记录弹窗 */}
        <HistoryConversation />

        {/* 消息弹窗 */}
        <Message />

        {/* 设置弹窗 */}
        <Setting />

        {/* 移动端菜单按钮和遮罩层 */}
        {isMobile && (
          <MobileMenu
            isOpen={fullMobileMenu}
            onToggle={toggleFullMobileMenu}
            menuWidth={getCurrentMenuWidth()}
          />
        )}
      </div>

      {/* 主内容区 */}
      <div
        className={`${pageContainerClassName} scroll-container`}
        id="page-container-selector"
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
