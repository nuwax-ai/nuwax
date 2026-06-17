/** ttyd 终端 WebSocket 子协议 */
export const TTYD_TERMINAL_WS_SUBPROTOCOLS = ['tty'] as const;

/** ttyd 终端 wire 协议 */
export const TTYD_TERMINAL_WIRE_PROTOCOL = 'ttyd' as const;

/** 本地 ttyd 联调默认地址（缺少 tenant/computer 时回退） */
const DEV_TTYD_WS_FALLBACK = (conversationId: number) =>
  `wss://testagent.xspaceagi.com/computer/terminal/${conversationId}/ws`;

/**
 * 将 http(s)/ws(s) 基础地址规范化为 WebSocket URL
 */
export function normalizeTerminalWsUrl(base: string): string {
  try {
    const u = new URL(base);
    const wsScheme =
      u.protocol === 'https:'
        ? 'wss:'
        : u.protocol === 'http:'
        ? 'ws:'
        : u.protocol;
    const path = u.pathname === '/' || u.pathname === '' ? '/ws' : u.pathname;
    return `${wsScheme}//${u.host}${path}`;
  } catch {
    return base || '';
  }
}

/**
 * 构建 ttyd 终端 WebSocket 地址
 * @param conversationId 会话 ID
 */
export function buildTtydTerminalWsUrl(conversationId?: number): string {
  if (!conversationId) {
    return '';
  }

  if (typeof window !== 'undefined') {
    const wsScheme =
      process.env.NODE_ENV === 'development'
        ? 'wss'
        : window.location.protocol === 'https:'
        ? 'wss'
        : 'ws';

    // 开发环境使用测试域名，生产环境使用当前域名
    const host =
      process.env.NODE_ENV === 'development'
        ? 'testagent.xspaceagi.com'
        : window.location.host;
    return normalizeTerminalWsUrl(
      `${wsScheme}://${host}/computer/terminal/${conversationId}/ws`,
    );
  }
  return normalizeTerminalWsUrl(DEV_TTYD_WS_FALLBACK(conversationId));
}
