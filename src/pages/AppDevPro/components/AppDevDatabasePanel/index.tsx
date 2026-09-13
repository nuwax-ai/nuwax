import { dict } from '@/services/i18nRuntime';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type { UserAppEnvPodStatus } from '../../hooks/useUserAppEnvPod';
import { getUserAppDbProxyUrl, UserAppDbEnvEnum } from '../../services/appDb';
import AppDevProIframe from '../AppDevProIframe';
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
}) => {
  const iframeSrc = useMemo(() => {
    if (!appId) {
      return '';
    }
    return getUserAppDbProxyUrl(appId, env);
  }, [appId, env]);

  const waitingContainer =
    env === UserAppDbEnvEnum.Prod &&
    containerStatus !== undefined &&
    containerStatus !== 'running';

  if (waitingContainer) {
    const isError = containerStatus === 'error';
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.empty)}>
          {isError ? (
            <div className={cx(styles['container-hint'])}>
              <span>{dict('PC.Pages.AppDevPro.prodContainerFailed')}</span>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={onRetryContainer}
              >
                {dict('PC.Pages.AppDevPro.prodContainerRetry')}
              </Button>
            </div>
          ) : (
            <div className={cx(styles['container-hint'])}>
              <Spin />
              <span>{dict('PC.Pages.AppDevPro.prodContainerStarting')}</span>
            </div>
          )}
        </div>
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
        title={dict('PC.Pages.AppDevPro.database')}
      />
    </div>
  );
};

export default AppDevDatabasePanel;
