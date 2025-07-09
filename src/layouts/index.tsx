import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Outlet, useModel } from 'umi';
import HistoryConversation from './HistoryConversation';
import styles from './index.less';
import MenusLayout from './MenusLayout';
import Message from './Message';
import MobileMenu from './MobileMenu';
import Setting from './Setting';

// 绑定 classNames，便于动态样式组合
const cx = classNames.bind(styles);

// 常量定义
const MOBILE_BREAKPOINT = 768; // 移动端断点
const MENU_WIDTH = 274; // 菜单宽度
const ANIMATION_DURATION = 300; // 动画持续时间
const MOBILE_MENU_TOP_PADDING = 32; // 移动端菜单顶部间距

/**
 * Layout 主布局组件
 * 负责响应式菜单、历史会话、消息、设置弹窗的布局与展示
 */
const Layout: React.FC = () => {
  // 使用 useRef 避免重复获取 DOM 元素
  const mobileMenuContainerRef = useRef<HTMLDivElement>(null);
  // 状态管理
  const {
    isMobile,
    setIsMobile,
    realHidden,
    setRealHidden,
    fullMobileMenu,
    setFullMobileMenu,
  } = useModel('layout');

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
        : `translateX(-${MENU_WIDTH}px)`;

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
  }, [fullMobileMenu, isMobile, handleTransitionEnd]);

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
      };
    }

    return {
      position: 'relative',
      width: MENU_WIDTH,
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

  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      {/* 侧边菜单栏及弹窗区域 */}
      <div
        ref={mobileMenuContainerRef}
        className={containerClassName}
        id="mobile-menu-container"
        style={sidebarStyle}
      >
        {/* 菜单栏 */}
        <MenusLayout overrideContainerStyle={menuOverrideStyle} />

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
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
