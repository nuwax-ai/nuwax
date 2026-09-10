/**
 * 侧栏共享壳：主容器（侧栏容器 + 内容区）的单一实现
 * @description 从原 layouts/index.tsx 整体搬移，供两类宿主复用：
 *  - variant="page"：内容区为 page-container（边距/圆角/沉浸避让/collapsed-expanded
 *    类，与 /home 等主站页面同款容器）。全屏工作台页在单栏模式下也走此形态，
 *    以 suppressSecondMenu 抑制二级菜单列（只保留主会话列）；
 *  - variant="bare"：经典风格/移动端的全屏工作台页，裸渲染内容区（不挂侧栏，
 *    维持历史顶层路由的全屏行为）。
 * 全屏工作台页与主站同处根路由树：宿主切换形态时本组件不重挂，侧栏
 * （DynamicMenusLayout 及会话列表）跨跳转存活、不重新初始化；
 * 菜单/广场分类/空间列表等引导数据只装一次（bare 态跳过，回带栏态补跑一次）。
 */
import {
  ANIMATION_DURATION,
  MOBILE_BREAKPOINT,
  MOBILE_MENU_TOP_PADDING,
} from '@/constants/layout.constants';
import useCategory from '@/hooks/useCategory';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { isImmersiveShell, isMac, shellAvoid } from '@/utils/nuwaClawBridge';
import { theme } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useModel } from 'umi';
import DynamicMenusLayout from '../DynamicMenusLayout';
import HoverMenu from '../HoverMenu';
import styles from '../index.less';
import Message from '../Message';
import MobileMenu from '../MobileMenu';
import Setting from '../Setting';

// 绑定 classNames，便于动态样式组合
const cx = classNames.bind(styles);

export type SidebarShellVariant = 'page' | 'bare';

export interface SidebarShellProps {
  /** 内容区形态：page=主站同款 page-container；bare=裸全屏（不挂侧栏） */
  variant?: SidebarShellVariant;
  /** 抑制二级菜单列（全屏工作台页宿主：只保留主会话列，不并列二级列） */
  suppressSecondMenu?: boolean;
  /** 沉浸态 page-container 是否加 marginTop 顶部避让。全屏工作台页为 false：
   * 其路由上的 immersiveShellAvoid 已承担避让，两层互斥不叠加 */
  immersiveMarginTop?: boolean;
  children?: React.ReactNode;
}

/**
 * 侧栏共享壳组件
 * 负责响应式菜单、历史会话、消息、设置弹窗的布局与展示
 */
const SidebarShell: React.FC<SidebarShellProps> = ({
  variant = 'page',
  suppressSecondMenu = false,
  immersiveMarginTop = true,
  children,
}) => {
  // 使用 useRef 避免重复获取 DOM 元素
  const mobileMenuContainerRef = useRef<HTMLDivElement>(null);

  const { runQueryCategory } = useCategory();

  // 导航风格管理（使用统一主题系统）；渲染决策统一读 effective 值（桌面端锁定单栏）
  const { effectiveNavigationStyle, layoutStyle } = useUnifiedTheme();
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

  const { asyncSpaceListFun } = useModel('spaceModel');
  const { loadMenus } = useModel('menuModel');

  /**
   * 检查是否为移动端设备
   * 使用 useCallback 优化，避免重复创建函数
   */
  const checkIsMobile = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  /**
   * 切换移动端菜单展开/收起
   * 使用 useCallback 优化，避免重复创建函数
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

  // 侧栏引导数据只装一次：bare（裸全屏）态跳过；回到带侧栏形态时补跑一次
  const sidebarBootstrappedRef = useRef(false);
  useEffect(() => {
    if (variant === 'bare') return;
    if (sidebarBootstrappedRef.current) return;
    sidebarBootstrappedRef.current = true;
    // 初始化加载菜单数据
    loadMenus();
    // 查询广场分类列表
    runQueryCategory();
    // 工作空间列表查询接口
    asyncSpaceListFun();
  }, [variant]);

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
  }, [isMobile, token.colorText, token.colorTextSecondary]);

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
        // { 'scroll-container': !isMobile },
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
        `xagi-nav-${effectiveNavigationStyle}`, // 导航风格类
      ),
    [layoutStyle, effectiveNavigationStyle],
  );

  /**
   * 内容区：主站同款 page-container（全屏工作台页也走此容器，
   * 二级列差异由 suppressSecondMenu 承担）
   */
  const contentNode = useMemo(() => {
    // 顶部避让（marginTop 而非 paddingTop：下移整个容器，不压缩内容可视高度）：
    // - Win/Linux 恒避让 shellAvoid.TOP（自绘三键+菜单栏所在的 36px 顶行恒在；
    //   原 TOP+8=44 偏大，评审要求收窄至与顶行同高）；
    // - mac 默认不退让（顶行透明、图标组悬浮于侧栏列上方，展开态内容区
    //   直接顶到窗口上沿）；仅整条侧栏收起后内容区顶到窗口上沿时，
    //   才避让工具栏整条高度（图标簇悬浮于内容区左上，需要让位）；
    // - 独立窗口（系统标题栏）与浏览器不避让；
    // - 全屏工作台页（immersiveMarginTop=false）由路由层 immersiveShellAvoid
    //   承担避让，此处叠加会造成双重下移。
    const macAvoidance = isSecondMenuCollapsed ? shellAvoid.TOOLBAR : undefined;
    const immersiveMargin = isMac() ? macAvoidance : shellAvoid.TOP;
    return (
      <div
        className={cx(
          'flex-1',
          styles[
            `xagi-layout-${isSecondMenuCollapsed ? 'collapsed' : 'expanded'}`
          ],
          styles['page-container'],
          styles[`xagi-layout-${layoutStyle}`],
          styles[`xagi-nav-${effectiveNavigationStyle}`],
          'overflow-hide',
        )}
        id="page-container-selector"
        style={{
          marginTop:
            isImmersiveShell() && immersiveMarginTop
              ? immersiveMargin
              : undefined,
        }}
      >
        {children}
      </div>
    );
  }, [
    children,
    immersiveMarginTop,
    isSecondMenuCollapsed,
    layoutStyle,
    effectiveNavigationStyle,
  ]);

  // 裸全屏形态：不挂侧栏容器与弹窗，仅满铺渲染页面内容（历史顶层全屏路由行为）
  if (variant === 'bare') {
    return (
      <div
        className={cx(
          'flex-1',
          'h-full',
          'overflow-hide',
          styles['fullscreen-page-container'],
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={mainContainerClassName}>
      {/* 侧边菜单栏及弹窗区域 */}
      <div
        ref={mobileMenuContainerRef}
        className={containerClassName}
        id="mobile-menu-container"
        style={sidebarStyle}
      >
        {/* 菜单栏（suppressSecondMenu：全屏工作台页宿主只保留主会话列） */}
        <DynamicMenusLayout
          overrideContainerStyle={menuOverrideStyle}
          isMobile={isMobile}
          suppressSecondMenu={suppressSecondMenu}
        />

        {/* 悬浮菜单（经典布局折叠态专用；单栏模式不渲染） */}
        {effectiveNavigationStyle !== ThemeNavigationStyleType.STYLE3 && (
          <HoverMenu />
        )}

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
      {contentNode}
    </div>
  );
};

export default SidebarShell;
