import { APP_VERSION } from '@/constants/version';

export type AppStartupStage =
  | 'preferences'
  | 'language'
  | 'session'
  | 'user'
  | 'profile-language'
  | 'menu'
  | 'auth'
  | 'reload';

export interface AppStartupDiagnostic {
  id: string;
  code: string;
  occurredAt: string;
  version: string;
}

const failures = new WeakMap<Error, AppStartupDiagnostic>();

/** 只记录本地阶段白名单，不把原始服务错误、URL 或凭据带入恢复界面和日志。 */
export function recordAppStartupFailure(
  error: unknown,
  stage: AppStartupStage,
): Error {
  const failure =
    error instanceof Error ? error : new Error('App startup failed');
  if (!failures.has(failure)) {
    const diagnostic = {
      id: `startup-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      code: `STARTUP_${stage.replace('-', '_').toUpperCase()}`,
      occurredAt: new Date().toISOString(),
      version: APP_VERSION,
    };
    failures.set(failure, diagnostic);
    console.warn('[AppStartup] failed', diagnostic);
  }
  return failure;
}

export function getAppStartupDiagnostic(
  error: unknown,
): AppStartupDiagnostic | undefined {
  return error instanceof Error ? failures.get(error) : undefined;
}
