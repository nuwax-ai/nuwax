// 代码编辑器的使用
import { useState } from 'react';

const useUser = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  return {
    open,
    setOpen,
    show,
    setShow,
  };
};

export default useUser;
