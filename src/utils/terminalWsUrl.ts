/** ttyd 终端 WebSocket 子协议 */
export const TTYD_TERMINAL_WS_SUBPROTOCOLS = ['tty'] as const;

/** ttyd 终端 wire 协议 */
export const TTYD_TERMINAL_WIRE_PROTOCOL = 'ttyd' as const;

/** 本地 ttyd 联调默认地址（缺少 tenant/computer 时回退） */
const DEV_TTYD_WS_FALLBACK =
  'ws://192.168.1.34:8088/computer/ttyd/6/1548510/ws';

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
 * @param tenantId 租户 ID
 * @param computerId 沙箱/电脑/项目 ID
 */
export function buildTtydTerminalWsUrl(
  tenantId?: string | number | null,
  computerId?: string | number | null,
): string {
  if (tenantId && computerId && typeof window !== 'undefined') {
    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeTerminalWsUrl(
      `${wsScheme}://${window.location.host}/computer/ttyd/${tenantId}/${computerId}/ws`,
    );
  }
  return normalizeTerminalWsUrl(DEV_TTYD_WS_FALLBACK);
}
