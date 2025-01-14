// 代码编辑器的使用
import { useState } from 'react';

const useModelSetting = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  const [expand, setExpand] = useState<boolean>(false);
  return {
    open,
    setOpen,
    show,
    setShow,
    expand,
    setExpand,
  };
};

export default useModelSetting;
