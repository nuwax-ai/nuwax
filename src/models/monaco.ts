// 代码编辑器的使用
import { useState } from 'react';

const useUser = () => {
  const [code, setCode] = useState<string>('');
  const [isShow, setIsShow] = useState<boolean>(false);
  return {
    code,
    setCode,
    isShow,
    setIsShow,
  };
};

export default useUser;
