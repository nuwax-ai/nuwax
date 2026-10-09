import { resolveStyle3PcKeepAliveEnabled } from '@/utils/style3PcKeepAlive';
import { useModel } from 'umi';
import useUnifiedTheme from './useUnifiedTheme';

/**
 * 整页会话保活只属于 PC 端 style3：商业客户端与桌面浏览器口径一致，
 * style1/style2 和移动端继续使用原路由生命周期。
 */
export const useStyle3PcKeepAliveEnabled = (): boolean => {
  const { effectiveNavigationStyle } = useUnifiedTheme();
  const { isMobile } = useModel('layout');

  return resolveStyle3PcKeepAliveEnabled(effectiveNavigationStyle, isMobile);
};

export default useStyle3PcKeepAliveEnabled;
