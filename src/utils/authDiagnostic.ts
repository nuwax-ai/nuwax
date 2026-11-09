import type { HostAuthClearDiagnostic } from '@/types/interfaces/hostBridge';

export interface AuthClearContext {
  source?: HostAuthClearDiagnostic['source'];
  reason?: HostAuthClearDiagnostic['reason'];
  requestUrl?: unknown;
  method?: unknown;
  status?: unknown;
  code?: unknown;
  microApp?: string;
}

let sequence = 0;

// 路径保留接口结构，查询参数、片段和动态 ID 不进入日志。
function diagnosticPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 4096) return undefined;
  try {
    return new URL(value, window.location.origin).pathname
      .split('/')
      .slice(0, 12)
      .map((part) =>
        !part || /^[a-zA-Z][a-zA-Z-]{0,39}$/.test(part) ? part : '*',
      )
      .join('/')
      .slice(0, 240);
  } catch {
    return undefined;
  }
}

export function createAuthClearDiagnostic(
  context: AuthClearContext = {},
): HostAuthClearDiagnostic {
  const method =
    typeof context.method === 'string' ? context.method.toUpperCase() : '';
  const code = typeof context.code === 'string' ? context.code : '';
  return {
    eventId: `auth-${Date.now().toString(36)}-${++sequence}`,
    source: context.source ?? 'unspecified',
    reason: context.reason ?? 'unspecified',
    requestPath: diagnosticPath(context.requestUrl),
    method: /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(method)
      ? method
      : undefined,
    status:
      typeof context.status === 'number' &&
      Number.isInteger(context.status) &&
      context.status >= 100 &&
      context.status <= 599
        ? context.status
        : undefined,
    code: /^(?:\d{4}|IM_\d{5})$/.test(code) ? code : undefined,
    microApp: ['nuwax-im-web', 'nuwax-repo-web'].includes(
      context.microApp ?? '',
    )
      ? context.microApp
      : undefined,
    pagePath:
      typeof window === 'undefined'
        ? undefined
        : diagnosticPath(window.location.pathname),
    visibility:
      typeof document === 'undefined' ? undefined : document.visibilityState,
    online: typeof navigator === 'undefined' ? undefined : navigator.onLine,
  };
}
