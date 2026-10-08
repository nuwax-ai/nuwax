import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import type { UserAppEnvPodStatus } from '../../hooks/useUserAppEnvPod';
import { getUserAppDbProxyUrl, UserAppDbEnvEnum } from '../../services/appDb';
import { UserAppReadinessStatusEnum } from '../../services/appDevPro';
import {
  pollUserAppDbReadiness,
  type UserAppDbReadinessSnapshot,
} from '../../utils/previewHealthCheck';
import AppDevProIframe from '../AppDevProIframe';
import AppDevServiceStartStatus, {
  AppDevStatusHero,
} from '../AppDevStatusHero';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 需要单独告诉用户的数据库状态。
 * 降级、未知、不支持、停止中等仍在继续检测，不单独展示。
 */
const DATABASE_STATUS_TITLE: Partial<
  Record<UserAppReadinessStatusEnum, string>
> = {
  [UserAppReadinessStatusEnum.NotDeployed]:
    'PC.Pages.AppDevPro.databaseStatusNotDeployed',
  [UserAppReadinessStatusEnum.Starting]:
    'PC.Pages.AppDevPro.databaseStatusStarting',
  [UserAppReadinessStatusEnum.Failed]:
    'PC.Pages.AppDevPro.databaseStatusFailed',
};

/** 检测尚未结束时的转圈文案 */
const databaseCheckingView = () => ({
  title: dict('PC.Pages.AppDevPro.databaseChecking'),
  hint: dict('PC.Pages.AppDevPro.databaseCheckingHint'),
  spinning: true,
  error: false,
});

/**
 * 把最近一次探测结果转成居中状态。
 * 只展示未部署、启动中、启动失败；其余状态继续按检测中显示。
 *
 * @param snapshot 最近一次探测；还没有结果时按检测中展示
 * @returns 状态标题、说明、是否转圈、是否错误态
 */
const resolveDatabaseStatusView = (
  snapshot: UserAppDbReadinessSnapshot | null,
) => {
  if (!snapshot || snapshot.status === UserAppReadinessStatusEnum.Ready) {
    return databaseCheckingView();
  }
  if (snapshot.requestFailed) {
    return {
      title: dict('PC.Pages.AppDevPro.databaseStatusRequestError'),
      hint:
        snapshot.message || dict('PC.Pages.AppDevPro.databaseStatusRetryHint'),
      spinning: true,
      error: true,
    };
  }
  const titleKey = snapshot.status
    ? DATABASE_STATUS_TITLE[snapshot.status]
    : undefined;
  if (!titleKey) {
    return databaseCheckingView();
  }
  const spinning = snapshot.status === UserAppReadinessStatusEnum.Starting;
  return {
    title: dict(titleKey),
    hint:
      snapshot.message ||
      dict(
        spinning
          ? 'PC.Pages.AppDevPro.databaseCheckingHint'
          : 'PC.Pages.AppDevPro.databaseStatusRetryHint',
      ),
    spinning,
    error: !spinning,
  };
};

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
  /** 本环境是否已经在就绪后加载过管理页，隐藏后继续保留 iframe */
  const [keepIframe, setKeepIframe] = useState(false);
  /** 正在轮询数据库就绪。只有就绪后才展示管理页 */
  const [checking, setChecking] = useState(false);
  /** 最近一次就绪探测，用于展示当前状态 */
  const [readiness, setReadiness] = useState<UserAppDbReadinessSnapshot | null>(
    null,
  );

  const waitingContainer =
    containerStatus !== undefined && containerStatus !== 'running';

  useEffect(() => {
    setKeepIframe(false);
    setChecking(false);
    setReadiness(null);
  }, [appId, iframeKey]);

  useEffect(() => {
    if (!active || !appId || !iframeSrc || waitingContainer || keepIframe) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    setReadiness(null);
    void (async () => {
      const ready = await pollUserAppDbReadiness(appId, env, {
        shouldStop: () => cancelled,
        onProgress: (snapshot) => {
          if (!cancelled) {
            setReadiness(snapshot);
          }
        },
      });
      if (cancelled || !ready) {
        return;
      }
      setChecking(false);
      setKeepIframe(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [active, appId, env, iframeSrc, waitingContainer, keepIframe, iframeKey]);

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
  const statusView = resolveDatabaseStatusView(readiness);

  return (
    <div className={cx(styles.container)}>
      {showChecking ? (
        <AppDevStatusHero
          spinning={statusView.spinning}
          error={statusView.error}
          title={statusView.title}
          hint={statusView.hint}
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
