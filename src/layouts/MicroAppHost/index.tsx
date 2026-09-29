import { t } from '@/services/i18nRuntime';
import { subscribeImEvents } from '@/services/imEventBridge';
import { expireMicroAppSession } from '@/services/microAppAuth';
import { prepareMicroAppAuthSession } from '@/utils/businessAuth';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { findMicroAppRoute, MICRO_APP_ROUTES } from '@/utils/microAppRoutes';
import { Button, Spin } from 'antd';
import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { history } from 'umi';
import styles from './index.less';
import { microAppLifecycleQueue } from './lifecycle';
import { microAppHostStore, type MicroAppHostEntry } from './store';

interface MicroAppInstanceProps {
  entry: MicroAppHostEntry;
  active: boolean;
}

const MicroAppInstance: React.FC<MicroAppInstanceProps> = ({
  entry,
  active,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef({ entry, active });
  currentRef.current = { entry, active };
  const leaseRef = useRef<ReturnType<typeof microAppLifecycleQueue.acquire>>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );

  useEffect(() => {
    const config = MICRO_APP_ROUTES.find((item) => item.name === entry.name);
    const container = containerRef.current;
    if (!config || !container) return;
    let mounted = true;
    let unsubscribeImEvents: (() => void) | undefined;

    const onNavigate = (path: string, replace = false) => {
      if (!mounted || !currentRef.current.active || !path.startsWith('/'))
        return;
      const url = new URL(path, window.location.origin);
      if (
        url.origin !== window.location.origin ||
        findMicroAppRoute(url.pathname)?.name !== entry.name
      ) {
        return;
      }
      const target = `${url.pathname}${url.search}${url.hash}`;
      const current = history.location;
      if (
        `${current.pathname}${current.search}${current.hash || ''}` === target
      )
        return;
      if (replace) history.replace(target);
      else history.push(target);
    };

    const lease = microAppLifecycleQueue.acquire(entry.name, async () => {
      if (!(await prepareMicroAppAuthSession())) {
        throw new Error('微应用会话同步失败');
      }
      if (!mounted) throw new Error('微应用加载已取消');
      const { loadMicroApp } = await import('qiankun');
      if (!mounted) throw new Error('微应用加载已取消');
      return loadMicroApp(
        {
          name: entry.name,
          entry: config.entry,
          container,
          props: {
            path: currentRef.current.entry.path,
            active: currentRef.current.active,
            onNavigate,
            onAuthExpired: (target: string) => {
              if (mounted) {
                void expireMicroAppSession(target).catch((error) =>
                  console.error('[micro-app] 认证跳转失败', error),
                );
              }
            },
          },
        },
        { sandbox: true },
      );
    });
    leaseRef.current = lease;
    void lease.ready.then(
      (handle) => {
        if (handle && !lease.isDisposed()) {
          if (entry.name === 'nuwax-im-web') {
            unsubscribeImEvents = subscribeImEvents();
          }
          setStatus('ready');
        }
      },
      (error) => {
        if (!lease.isDisposed()) {
          console.error('[micro-app] 加载失败', error);
          setStatus('failed');
        }
      },
    );
    return () => {
      mounted = false;
      unsubscribeImEvents?.();
      lease.dispose();
      if (leaseRef.current === lease) leaseRef.current = undefined;
    };
  }, [entry.name, entry.generation]);

  useEffect(() => {
    const lease = leaseRef.current;
    if (!lease) return;
    void lease.update({ path: entry.path, active }).catch((error) => {
      if (!lease.isDisposed()) {
        console.error('[micro-app] 路由同步失败', error);
        setStatus('failed');
      }
    });
  }, [entry.path, active]);

  return (
    <div
      data-micro-app={entry.name}
      aria-hidden={!active}
      style={{
        display: active ? 'block' : 'none',
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      <div ref={containerRef} className={styles.container} />
      {status !== 'ready' && (
        <div
          role={status === 'failed' ? 'alert' : 'status'}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: 'var(--xagi-color-bg-container, #fff)',
          }}
        >
          {status === 'loading' ? (
            <>
              <Spin />
              <span>{t('PC.Components.MicroAppHost.loading')}</span>
            </>
          ) : (
            <>
              <span>{t('PC.Components.MicroAppHost.loadFailed')}</span>
              <Button onClick={() => microAppHostStore.reload(entry.name)}>
                {t('PC.Components.MicroAppHost.retry')}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/** 固定在主站内容插槽内；仅当前微应用占位，其余实例常驻隐藏。 */
const MicroAppHost: React.FC = () => {
  const snapshot = useSyncExternalStore(
    microAppHostStore.subscribe,
    microAppHostStore.getSnapshot,
    microAppHostStore.getSnapshot,
  );

  useEffect(() => {
    const clear = () => microAppHostStore.invalidateAll();
    eventBus.on(EVENT_NAMES.AUTH_SESSION_CLEARED, clear);
    return () => eventBus.off(EVENT_NAMES.AUTH_SESSION_CLEARED, clear);
  }, []);

  return (
    <div
      data-micro-app-host
      style={{
        height: '100%',
        width: '100%',
        display: snapshot.activeName ? 'block' : 'none',
      }}
    >
      {snapshot.entries.map((entry) => (
        <MicroAppInstance
          key={`${entry.name}:${entry.generation}`}
          entry={entry}
          active={snapshot.activeName === entry.name}
        />
      ))}
    </div>
  );
};

export default MicroAppHost;
