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

  const handleCloseMobileMenu = () => {
    if (isMobile) {
      setRealHidden(true);
      setFullMobileMenu(false);
    }
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
  };
};

export default useLayout;
