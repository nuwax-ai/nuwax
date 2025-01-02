import { useState } from 'react';

const useUser = () => {
  const [openHistoryModal, setOpenHistoryModal] = useState<boolean>(false);
  return {
    openHistoryModal,
    setOpenHistoryModal,
  };
};

export default useUser;
