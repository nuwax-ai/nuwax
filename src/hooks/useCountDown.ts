import { COUNT_DOWN_LEN } from '@/constants/common.constants';
import { useRef, useState } from 'react';

const useCountDown = () => {
  const [countDown, setCountDown] = useState<number>(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const handleCount = () => {
    let startCount = COUNT_DOWN_LEN;
    setCountDown(startCount);

    timer.current = setInterval(() => {
      startCount--;
      setCountDown(startCount);
      if (startCount === 0) {
        clearInterval(timer.current);
        timer.current = undefined;
      }
    }, 1000);
  };

  return {
    countDown,
    handleCount,
  };
};

export default useCountDown;
