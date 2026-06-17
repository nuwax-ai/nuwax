import { buildTtydTerminalWsUrl } from '@/utils/terminalWsUrl';
import { useMemo } from 'react';

/**
 * 获取 ttyd 终端 WebSocket 地址
 * @param conversationId 会话 ID
 */
export function useTerminalWsUrl(conversationId?: number): string {
  return useMemo(
    () => buildTtydTerminalWsUrl(conversationId),
    [conversationId],
  );
}

export default useTerminalWsUrl;
