import menuIcon from '@/assets/images/menu.png';
import { Button } from 'antd';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'umi';
import HistoryConversation from './HistoryConversation';
import styles from './index.less';
import MenusLayout from './MenusLayout';
import Message from './Message';
import Setting from './Setting';

const cx = classNames.bind(styles);

/**
 * 移动端菜单按钮组件
 * @param props.onClick 点击事件回调
 * @param props.isOpen 菜单是否展开
 */
const MobileMenuButton = ({
  onClick,
  isOpen,
}: {
  onClick: () => void;
  isOpen: boolean;
}) => (
  <div
    id="mobile-menu"
    style={{
      position: 'fixed',
      top: '6px',
      left: '274px',
      marginLeft: isOpen ? '6px' : '-38px',
      transition: 'margin-left 0.3s ease-in-out',
      zIndex: 1000,
    }}
  >
    <Button
      type="text"
      aria-label={isOpen ? '关闭菜单' : '展开菜单'}
      onClick={onClick}
      icon={
        <img
          src={menuIcon}
          style={{ width: '24px', height: '24px' }}
          alt="menu"
        />
      }
    />
  </div>
);

/**
 * 移动端菜单遮罩层组件
 * @param props.visible 是否显示遮罩
 * @param props.onClick 点击遮罩关闭菜单
 */
const MobileMenuMask = ({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) => (
  <div
    style={{
      display: visible ? 'block' : 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.15)',
      zIndex: 998,
    }}
    onClick={onClick}
  />
);

/**
 * Layout 主布局组件
 * 负责响应式菜单、历史会话、消息、设置弹窗的布局与展示
 */
export default function Layout() {
  // 是否为移动端
  const [isMobile, setIsMobile] = useState(false);
  // 移动端菜单是否完全展开
  const [fullMobileMenu, setFullMobileMenu] = useState(false);

  /**
   * 切换移动端菜单展开/收起
   * 使用 useCallback 优化，避免不必要的重渲染
   */
  const toggleFullMobileMenu = useCallback(() => {
    setFullMobileMenu((prev) => !prev);
  }, []);

  /**
   * 监听窗口尺寸变化，判断是否为移动端
   */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
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

  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      {/* 侧边菜单栏及弹窗区域 */}
      <div
        className={cx('flex', 'h-full')}
        id="mobile-menu-container"
        style={
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
                width: '274px',
                height: '100%',
              }
        }
      >
        {/* 菜单栏 */}
        <MenusLayout
          overrideContainerStyle={isMobile ? { paddingTop: '32px' } : {}}
        />
        {/* 历史会话记录弹窗 */}
        <HistoryConversation />
        {/* 消息弹窗 */}
        <Message />
        {/* 设置弹窗 */}
        <Setting />
        {/* 移动端菜单按钮和遮罩层 */}
        {isMobile && (
          <>
            <MobileMenuButton
              onClick={toggleFullMobileMenu}
              isOpen={fullMobileMenu}
            />
            <MobileMenuMask
              visible={!fullMobileMenu}
              onClick={toggleFullMobileMenu}
            />
          </>
        )}
      </div>
      {/* 主内容区 */}
      <div className={cx('flex-1', 'overflow-y')}>
        {/* 页面内容 */}
        <Outlet />
      </div>
    </div>
  );
}
