import { useState } from 'react';

const useModelSetting = () => {
  const [open, setOpen] = useState<boolean>(false);
  // 展开收起模型设置的弹窗
  const [show, setShow] = useState<boolean>(false);
  // 展开收起提示词
  const [expand, setExpand] = useState<boolean>(false);
  // 展开收起试运行
  const [testRun, setTestRun] = useState<boolean>(false);

  return {
    open,
    setOpen,
    show,
    setShow,
    expand,
    setExpand,
    testRun,
    setTestRun,
  };
};

export default useModelSetting;
