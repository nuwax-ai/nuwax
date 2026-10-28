import { COUNT_DOWN_LEN } from '@/constants/common.constants';
import { useEffect, useRef, useState } from 'react';

const useCountDown = () => {
  const [countDown, setCountDown] = useState<number>(COUNT_DOWN_LEN);
  const timer = useRef<number>(0);

  const onClearTimer = () => {
    clearInterval(timer.current);
    timer.current = 0;
  };

  const handleCount = (startCount = COUNT_DOWN_LEN) => {
    onClearTimer();
    let current = Math.max(0, Math.ceil(startCount));
    setCountDown(current);
    if (current <= 0) return;

    timer.current = window.setInterval(() => {
      current -= 1;
      setCountDown(current);
      if (current <= 0) {
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
