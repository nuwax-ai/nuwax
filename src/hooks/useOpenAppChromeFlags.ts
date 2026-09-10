import { parseOpenAppChromeFlags } from '@/utils/openAppChromeFlags';
import { useMemo } from 'react';
import { useLocation } from 'umi';

/**
 * 读取独立会话页 URL query 中的 chrome 隐藏开关。
 * @returns hideMenu / hideNew / hideTitle / hideTerminal / hideTree
 */
const useOpenAppChromeFlags = () => {
  const location = useLocation();
  return useMemo(
    () => parseOpenAppChromeFlags(location.search),
    [location.search],
  );
};

export default useOpenAppChromeFlags;
