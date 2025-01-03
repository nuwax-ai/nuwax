import { useState } from 'react';

const useLayout = () => {
  const [openHistoryModal, setOpenHistoryModal] = useState<boolean>(false);
  const [openMessage, setOpenMessage] = useState<boolean>(false);
  const [openAdmin, setOpenAdmin] = useState<boolean>(false);
  const [openSetting, setOpenSetting] = useState<boolean>(false);
  return {
    openHistoryModal,
    setOpenHistoryModal,
    openMessage,
    setOpenMessage,
    openAdmin,
    setOpenAdmin,
    openSetting,
    setOpenSetting,
  };
};

export default useLayout;
