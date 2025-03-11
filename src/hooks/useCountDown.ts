import { COUNT_DOWN_LEN } from '@/constants/common.constants';
import { useEffect, useRef, useState } from 'react';

const useCountDown = () => {
  const [countDown, setCountDown] = useState<number>(COUNT_DOWN_LEN);
  const timer = useRef<number>(0);

  const onClearTimer = () => {
    clearInterval(timer.current);
    timer.current = 0;
  }

  const handleCount = () => {
    let startCount = COUNT_DOWN_LEN;
    setCountDown(startCount);

    timer.current = setInterval(() => {
      startCount--;
      setCountDown(startCount);
      if (startCount === 0) {
        onClearTimer();
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      onClearTimer();
    };
  }, []);

  return {
    countDown,
    setCountDown,
    onClearTimer,
    handleCount,
  };
};

export default useCountDown;
