import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import type { UserAppEnvPodStatus } from '../../hooks/useUserAppEnvPod';
import { getUserAppDbProxyUrl, UserAppDbEnvEnum } from '../../services/appDb';
import { pollUserAppDbReadiness } from '../../utils/previewHealthCheck';
import AppDevProIframe from '../AppDevProIframe';
import AppDevServiceStartStatus, {
  AppDevStatusHero,
} from '../AppDevStatusHero';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevDatabasePanelProps {
  /** 应用 ID，用于拼数据库代理地址 */
  appId?: number;
  /** 当前环境，由 Header 中间切换控制 */
  env: UserAppDbEnvEnum;
  /**
   * 线上环境容器状态。未传时直接加载 iframe（开发环境进页已预启动）。
   * 线上环境须 running 后才嵌入管理页。
   */
  containerStatus?: UserAppEnvPodStatus;
  /** 线上环境容器启动失败时重试 */
  onRetryContainer?: () => void;
  /** 容器重启成功后重挂 iframe */
  iframeKey?: number;
  /**
   * 当前环境的数据库页是否可见。
   * 第一次可见时才挂 iframe；之后隐藏也保留，再次进入不重新加载。
   */
  active?: boolean;
}

/**
 * AppDevPro 数据库页签内容：按当前环境嵌入数据库管理页。
 *
 * @param props.appId 应用 ID
 * @param props.env 当前环境（开发 / 线上）
 * @returns 数据库面板
 */
const AppDevDatabasePanel: React.FC<AppDevDatabasePanelProps> = ({
  appId,
  env,
  containerStatus,
  onRetryContainer,
  iframeKey = 0,
  active = true,
}) => {
  const iframeSrc = useMemo(() => {
    if (!appId) {
      return '';
    }
    return getUserAppDbProxyUrl(appId, env);
  }, [appId, env]);
  /** 本环境是否已经在可见时加载过管理页，隐藏后继续保留 iframe */
  const [keepIframe, setKeepIframe] = useState(false);
  /** 正在轮询数据库就绪。结束后无论成败都展示管理页 */
  const [checking, setChecking] = useState(false);

  const waitingContainer =
    containerStatus !== undefined && containerStatus !== 'running';

  useEffect(() => {
    setKeepIframe(false);
    setChecking(false);
  }, [appId]);

  useEffect(() => {
    if (!active || !appId || !iframeSrc || waitingContainer) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    void (async () => {
      try {
        await pollUserAppDbReadiness(appId, env, () => cancelled);
      } catch {
        // 探测抛错也不要挡住数据库
      }
      if (cancelled) {
        return;
      }
      setChecking(false);
      setKeepIframe(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [active, appId, env, iframeSrc, waitingContainer]);

  if (!active && !keepIframe) {
    return <div className={cx(styles.container)} />;
  }

  if (active && waitingContainer) {
    return (
      <div className={cx(styles.container)}>
        <AppDevServiceStartStatus
          failed={containerStatus === 'error'}
          onRetry={onRetryContainer}
        />
      </div>
    );
  }

  if (active && !iframeSrc) {
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.empty)}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppDevPro.databaseEmpty')}
          />
        </div>
      </div>
    );
  }

  const showChecking = active && checking;

  return (
    <div className={cx(styles.container)}>
      {showChecking ? (
        <AppDevStatusHero
          spinning
          title={dict('PC.Pages.AppDevPro.databaseChecking')}
          hint={dict('PC.Pages.AppDevPro.databaseCheckingHint')}
        />
      ) : null}
      {keepIframe ? (
        <div
          className={cx(styles.iframePane, {
            [styles.iframeHold]: showChecking,
          })}
        >
          <AppDevProIframe
            src={iframeSrc}
            iframeKey={iframeKey}
            title={dict('PC.Pages.AppDevPro.database')}
            errorDescription={dict('PC.Pages.AppDevPro.databaseNotReady')}
          />
        </div>
      ) : null}
    </div>
  );
};

export default AppDevDatabasePanel;
