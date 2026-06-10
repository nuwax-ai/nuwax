import { buildTtydTerminalWsUrl } from '@/utils/terminalWsUrl';
import { useMemo } from 'react';

/**
 * 根据租户与沙箱/项目 ID 生成 ttyd 终端 WebSocket 地址
 */
export function useTerminalWsUrl(
  tenantId?: string | number | null,
  computerId?: string | number | null,
): string {
  return useMemo(
    () => buildTtydTerminalWsUrl(tenantId, computerId),
    [tenantId, computerId],
  );
}

export default useTerminalWsUrl;
