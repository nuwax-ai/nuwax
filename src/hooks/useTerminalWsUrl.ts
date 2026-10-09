import {
  buildTtydTerminalWsUrl,
  type TtydTerminalWsUrlOptions,
} from '@/utils/terminalWsUrl';
import { useMemo } from 'react';

/**
 * 获取 ttyd 终端 WebSocket 地址
 * @param conversationId 会话 ID
 * @param options 终端契约参数（serviceType 业务场景 / cwd 显式初始目录）
 */
export function useTerminalWsUrl(
  conversationId?: number,
  options?: TtydTerminalWsUrlOptions,
): string {
  const { serviceType, cwd } = options ?? {};
  return useMemo(
    () => buildTtydTerminalWsUrl(conversationId, { serviceType, cwd }),
    // 解构原始值入依赖，避免调用方传对象字面量导致 memo 每次失效
    [conversationId, serviceType, cwd],
  );
}

export default useTerminalWsUrl;
