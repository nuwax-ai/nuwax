/** ttyd 终端 WebSocket 子协议 */
export const TTYD_TERMINAL_WS_SUBPROTOCOLS = ['tty'] as const;

/** ttyd 终端 wire 协议 */
export const TTYD_TERMINAL_WIRE_PROTOCOL = 'ttyd' as const;

/** 本地 ttyd 联调默认地址（缺少 tenant/computer 时回退） */
const DEV_TTYD_WS_FALLBACK = (conversationId: number) =>
  `wss://testagent.xspaceagi.com/computer/terminal/${conversationId}/ws`;

/** 与服务端/基座网关契约对齐的终端业务类型（省略=默认 agent-runner，仅显式传非默认值） */
export type TtydServiceTypeParam =
  | 'computer-agent-runner'
  | 'computer-normal-project';

export interface TtydTerminalWsUrlOptions {
  /** 终端业务类型；常规项目（normalProject）会话传 'computer-normal-project' */
  serviceType?: TtydServiceTypeParam;
  /** 显式初始目录（本机绝对路径），优先于按业务推导的默认目录 */
  cwd?: string;
}

/**
 * 将 http(s)/ws(s) 基础地址规范化为 WebSocket URL（保留 query string）
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
    return `${wsScheme}//${u.host}${path}${u.search}`;
  } catch {
    return base || '';
  }
}

/**
 * 拼接终端契约 query 参数（service_type / cwd）。
 * URLSearchParams 按 form 语义编码（空格→+、字面+→%2B、中文→UTF-8 percent），
 * 与服务端 rcoder ttyd_params 解码、基座网关 URLSearchParams 解析天然对齐。
 */
function buildTerminalQueryString(options?: TtydTerminalWsUrlOptions): string {
  if (!options) return '';
  const params = new URLSearchParams();
  if (options.serviceType) params.set('service_type', options.serviceType);
  if (options.cwd) params.set('cwd', options.cwd);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * 构建 ttyd 终端 WebSocket 地址
 * @param conversationId 会话 ID
 * @param options 终端契约参数（service_type 业务场景 / cwd 显式初始目录）
 */
export function buildTtydTerminalWsUrl(
  conversationId?: number,
  options?: TtydTerminalWsUrlOptions,
): string {
  if (!conversationId) {
    return '';
  }

  const qs = buildTerminalQueryString(options);

  if (typeof window !== 'undefined') {
    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';

    // 当前域名
    const host = window.location.host;

    const url = normalizeTerminalWsUrl(
      `${wsScheme}://${host}/computer/terminal/${conversationId}/ws${qs}`,
    );
    return url;
  }
  return normalizeTerminalWsUrl(DEV_TTYD_WS_FALLBACK(conversationId) + qs);
}
