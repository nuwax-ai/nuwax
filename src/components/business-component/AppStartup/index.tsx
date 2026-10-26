import logoUrl from '@/assets/images/logo.png';
import {
  getAppStartupDiagnostic,
  recordAppStartupFailure,
  type AppStartupDiagnostic,
} from '@/services/appStartupDiagnostics';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';
import { startupText } from './startupText';

export const STARTUP_WAIT_NOTICE_MS = 15_000;

interface AppStartupProps {
  failed?: boolean;
  diagnostic?: AppStartupDiagnostic;
  onReload?: () => void | Promise<void>;
}

const reloadDocument = () => window.location.reload();

/** 首屏反馈期限不是 API 超时；原请求仍可自然恢复，不在后台重发请求。 */
const AppStartup: React.FC<AppStartupProps> = ({
  failed = false,
  diagnostic,
  onReload = reloadDocument,
}) => {
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [reloadFailure, setReloadFailure] = useState<AppStartupDiagnostic>();
  const reloadStarted = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (failed) return;
    setWaitingTooLong(false);
    const timer = window.setTimeout(
      () => setWaitingTooLong(true),
      STARTUP_WAIT_NOTICE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [failed]);

  const showReloadFailure = (error: unknown) => {
    if (!mounted.current) return;
    reloadStarted.current = false;
    setReloading(false);
    const failure = recordAppStartupFailure(error, 'reload');
    setReloadFailure(getAppStartupDiagnostic(failure));
  };

  const retry = () => {
    if (reloadStarted.current) return;
    reloadStarted.current = true;
    setReloadFailure(undefined);
    setReloading(true);
    try {
      // 销毁旧文档后再启动，避免并发 refresh 或迟到响应覆盖；不清登录态。
      // 拒绝只代表未能发起刷新，不能把按钮永久停在忙碌状态。
      void Promise.resolve(onReload()).catch(showReloadFailure);
    } catch (error) {
      showReloadFailure(error);
    }
  };

  const isFailure = !reloading && (failed || !!reloadFailure);
  const showActions = failed || waitingTooLong || reloading || !!reloadFailure;
  const titleKey = reloading
    ? 'reloading'
    : isFailure
    ? 'failed'
    : waitingTooLong
    ? 'waiting'
    : 'loading';
  const hintKey = reloading
    ? 'reloadingHint'
    : reloadFailure
    ? 'reloadFailedHint'
    : failed
    ? 'failedHint'
    : waitingTooLong
    ? 'waitingHint'
    : 'loadingHint';
  const visibleDiagnostic = reloadFailure ?? diagnostic;

  return (
    <main className={styles.container}>
      <section
        className={styles.content}
        data-state={
          reloading
            ? 'reloading'
            : isFailure
            ? 'failed'
            : waitingTooLong
            ? 'waiting'
            : 'loading'
        }
        role={isFailure ? 'alert' : 'status'}
        aria-live={isFailure ? 'assertive' : 'polite'}
        aria-busy={reloading}
      >
        <div className={styles.brandMark} aria-hidden="true">
          <span className={styles.logoFallback}>N</span>
          <img
            src={logoUrl}
            alt=""
            onError={({ currentTarget }) => {
              currentTarget.hidden = true;
            }}
          />
          {!isFailure && <span className={styles.spinner} />}
          {isFailure && <span className={styles.failureMark}>!</span>}
        </div>
        <p className={styles.brandName}>Nuwax</p>
        <h1>{startupText(`PC.Components.AppStartup.${titleKey}`)}</h1>
        <p className={styles.hint}>
          {startupText(`PC.Components.AppStartup.${hintKey}`)}
        </p>
        {showActions && (
          <button
            className={styles.reloadButton}
            type="button"
            onClick={retry}
            disabled={reloading}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className={reloading ? styles.buttonSpinner : undefined}
            >
              <path
                d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-1L20 9M4 15l2.3 3A7 7 0 0 0 17.9 17"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {startupText(
              `PC.Components.AppStartup.${reloading ? 'reloading' : 'reload'}`,
            )}
          </button>
        )}
        {isFailure && visibleDiagnostic && (
          <details className={styles.diagnostic}>
            <summary>{startupText('PC.Components.AppStartup.details')}</summary>
            <dl>
              <dt>{startupText('PC.Components.AppStartup.errorCode')}</dt>
              <dd>{visibleDiagnostic.code}</dd>
              <dt>{startupText('PC.Components.AppStartup.diagnosticId')}</dt>
              <dd>{visibleDiagnostic.id}</dd>
              <dt>{startupText('PC.Components.AppStartup.version')}</dt>
              <dd>{visibleDiagnostic.version}</dd>
              <dt>{startupText('PC.Components.AppStartup.time')}</dt>
              <dd>{visibleDiagnostic.occurredAt}</dd>
            </dl>
          </details>
        )}
      </section>
    </main>
  );
};

export default AppStartup;
