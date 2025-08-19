import {
  FIRST_MENU_WIDTH,
  SECOND_MENU_WIDTH,
} from '@/layouts/layout.constants';
import { useState } from 'react';

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
    }
  };

  // 显示悬浮菜单
  const handleShowHoverMenu = (menuType: string) => {
    if (isSecondMenuCollapsed) {
      setShowHoverMenu(true);
      setHoverMenuType(menuType);
    }
  };

  // 隐藏悬浮菜单
  const handleHideHoverMenu = () => {
    setShowHoverMenu(false);
    setHoverMenuType('');
  };

  // 动态计算菜单宽度
  const getCurrentMenuWidth = () => {
    return isSecondMenuCollapsed
      ? FIRST_MENU_WIDTH
      : FIRST_MENU_WIDTH + SECOND_MENU_WIDTH;
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
    getCurrentMenuWidth,
  };
};

export default useLayout;
