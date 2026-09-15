import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type { UserAppEnvPodStatus } from '../../hooks/useUserAppEnvPod';
import { getUserAppDbProxyUrl, UserAppDbEnvEnum } from '../../services/appDb';
import AppDevProIframe from '../AppDevProIframe';
import AppDevServiceStartStatus from '../AppDevStatusHero';
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
   * 当前页签是否可见。不可见时不挂 iframe，避免父级 display:none
   * 时提前加载，数据库页（尤其是线上环境）出现空白。
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

  const waitingContainer =
    containerStatus !== undefined && containerStatus !== 'running';

  if (!active) {
    return <div className={cx(styles.container)} />;
  }

  if (waitingContainer) {
    return (
      <div className={cx(styles.container)}>
        <AppDevServiceStartStatus
          failed={containerStatus === 'error'}
          onRetry={onRetryContainer}
        />
      </div>
    );
  }

  if (!iframeSrc) {
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

  return (
    <div className={cx(styles.container)}>
      <AppDevProIframe
        src={iframeSrc}
        iframeKey={iframeKey}
        title={dict('PC.Pages.AppDevPro.database')}
      />
    </div>
  );
};

export default AppDevDatabasePanel;
