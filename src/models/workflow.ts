import { useState } from 'react';

const useWorkflow = () => {
  // 是否要校验当前的数据
  const [volid, setVolid] = useState<boolean>(false);

  return {
    volid,
    setVolid,
  };
};

export default useWorkflow;
