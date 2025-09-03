import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useRef, useState } from 'react';

const useLayout = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [realHidden, setRealHidden] = useState<boolean>(false);
  const [fullMobileMenu, setFullMobileMenu] = useState<boolean>(false);
  const [openHistoryModal, setOpenHistoryModal] = useState<boolean>(false);
  // 未读消息数量
  const [unreadCount, setUnreadCount] = useState<number>(0);
  // 打开消息弹窗
  const [openMessage, setOpenMessage] = useState<boolean>(false);
  const [openAdmin, setOpenAdmin] = useState<boolean>(false);
  const [openSetting, setOpenSetting] = useState<boolean>(false);
  // 二级菜单收起/展开状态
  const [isSecondMenuCollapsed, setIsSecondMenuCollapsed] =
    useState<boolean>(false);
  // 悬浮菜单显示状态
  const [showHoverMenu, setShowHoverMenu] = useState<boolean>(false);
  // 当前悬浮菜单类型
  const [hoverMenuType, setHoverMenuType] = useState<string>('');
  // 鼠标是否在悬浮菜单内
  const [isMouseInHoverMenu, setIsMouseInHoverMenu] = useState<boolean>(false);

  // 悬浮菜单隐藏定时器引用
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCloseMobileMenu = () => {
    if (isMobile) {
      setRealHidden(true);
      setFullMobileMenu(false);
    }
  };

  // 切换二级菜单收起/展开状态
  const toggleSecondMenuCollapse = () => {
    setIsSecondMenuCollapsed(!isSecondMenuCollapsed);
    // 收起时隐藏悬浮菜单
    if (!isSecondMenuCollapsed) {
      setShowHoverMenu(false);
      setHoverMenuType('');
      setIsMouseInHoverMenu(false);
      // 清除定时器
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    }
  };

  // 显示悬浮菜单
  const handleShowHoverMenu = (menuType: string) => {
    if (isSecondMenuCollapsed) {
      // 清除之前的隐藏定时器
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setShowHoverMenu(true);
      setHoverMenuType(menuType);
      setIsMouseInHoverMenu(false);
    }
  };

  // 隐藏悬浮菜单（带延迟）
  const handleHideHoverMenu = () => {
    // 如果鼠标在悬浮菜单内，不隐藏
    if (isMouseInHoverMenu) {
      return;
    }

    // 设置延迟隐藏，给用户时间移动到悬浮菜单
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowHoverMenu(false);
      setHoverMenuType('');
      setIsMouseInHoverMenu(false);
      hideTimerRef.current = null;
    }, 200); // 200ms延迟，足够用户移动到悬浮菜单
  };

  // 立即隐藏悬浮菜单（用于清理）
  const handleImmediateHideHoverMenu = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setShowHoverMenu(false);
    setHoverMenuType('');
    setIsMouseInHoverMenu(false);
  };

  // 取消隐藏定时器（用于鼠标进入悬浮菜单时保持显示）
  const handleCancelHideHoverMenu = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // 设置鼠标在悬浮菜单内的状态
  const setMouseInHoverMenu = (isIn: boolean) => {
    setIsMouseInHoverMenu(isIn);
  };

  // 动态计算菜单宽度
  const getCurrentMenuWidth = () => {
    return isSecondMenuCollapsed
      ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1
      : NAVIGATION_LAYOUT_SIZES.getTotalMenuWidth('style1');
  };

  return {
    isMobile,
    setIsMobile,
    realHidden,
    setRealHidden,
    fullMobileMenu,
    setFullMobileMenu,
    handleCloseMobileMenu,
    openHistoryModal,
    setOpenHistoryModal,
    unreadCount,
    setUnreadCount,
    openMessage,
    setOpenMessage,
    openAdmin,
    setOpenAdmin,
    openSetting,
    setOpenSetting,
    // 二级菜单相关状态和方法
    isSecondMenuCollapsed,
    setIsSecondMenuCollapsed,
    toggleSecondMenuCollapse,
    showHoverMenu,
    setShowHoverMenu,
    hoverMenuType,
    setHoverMenuType,
    handleShowHoverMenu,
    handleHideHoverMenu,
    handleImmediateHideHoverMenu,
    handleCancelHideHoverMenu,
    getCurrentMenuWidth,
    setMouseInHoverMenu,
  };
};

export default useLayout;
