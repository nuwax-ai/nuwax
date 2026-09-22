import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';
import { startupText } from './startupText';

export const STARTUP_WAIT_NOTICE_MS = 15_000;

interface AppStartupProps {
  failed?: boolean;
  onReload?: () => void;
}

const reloadDocument = () => window.location.reload();

/** 首屏反馈期限不是 API 超时；原请求仍可自然恢复，不在后台重发请求。 */
const AppStartup: React.FC<AppStartupProps> = ({
  failed = false,
  onReload = reloadDocument,
}) => {
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  const [reloading, setReloading] = useState(false);
  const reloadStarted = useRef(false);

  useEffect(() => {
    if (failed) return;
    const timer = window.setTimeout(
      () => setWaitingTooLong(true),
      STARTUP_WAIT_NOTICE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [failed]);

  const retry = () => {
    if (reloadStarted.current) return;
    reloadStarted.current = true;
    setReloading(true);
    // 销毁旧文档后再启动，避免并发 refresh 或迟到响应覆盖；不清登录态。
    onReload();
  };

  return (
    <main className={styles.container}>
      <section
        className={styles.content}
        role={failed ? 'alert' : 'status'}
        aria-live={failed ? 'assertive' : 'polite'}
      >
        {!failed && <span className={styles.spinner} aria-hidden="true" />}
        <h1>
          {startupText(
            failed
              ? 'PC.Components.AppStartup.failed'
              : 'PC.Components.AppStartup.loading',
          )}
        </h1>
        {(failed || waitingTooLong) && (
          <>
            <p>
              {startupText(
                failed
                  ? 'PC.Components.AppStartup.failedHint'
                  : 'PC.Components.AppStartup.waitingHint',
              )}
            </p>
            <button type="button" onClick={retry} disabled={reloading}>
              {startupText(
                reloading
                  ? 'PC.Components.AppStartup.reloading'
                  : 'PC.Components.AppStartup.reload',
              )}
            </button>
          </>
        )}
      </section>
    </main>
  );
};

export default AppStartup;
