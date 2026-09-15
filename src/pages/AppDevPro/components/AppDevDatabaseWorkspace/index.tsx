import classNames from 'classnames';
import React from 'react';
import type { UserAppEnvPodStatus } from '../../hooks/useUserAppEnvPod';
import { UserAppDbEnvEnum } from '../../services/appDb';
import AppDevDatabaseConfigPanel from '../AppDevDatabaseConfigPanel';
import AppDevDatabasePanel from '../AppDevDatabasePanel';
import styles from './index.less';

const cx = classNames.bind(styles);

export type AppDevDatabaseWorkspaceTab = 'database' | 'database-config';

export interface AppDevDatabaseWorkspaceProps {
  /** 应用 ID */
  appId: number;
  /** 当前 Tab */
  activeTab: AppDevDatabaseWorkspaceTab;
  /** Header 当前环境 */
  env: UserAppDbEnvEnum;
  /** 开发环境容器状态 */
  devContainerStatus?: UserAppEnvPodStatus;
  /** 线上环境容器状态 */
  prodContainerStatus?: UserAppEnvPodStatus;
  /** 重试启动当前环境容器 */
  onRetryContainer?: () => void;
  /** 容器重启成功后重挂 iframe */
  iframeKey?: number;
}

/**
 * 数据库工作区：开发 / 线上各保留一套管理页，切换环境时不卸载。
 * 已启动成功的环境直接回显；未启动或失败的环境由页面重新 ensure。
 *
 * @param props.appId 应用 ID
 * @param props.activeTab 当前激活的数据库 Tab
 * @param props.env Header 当前环境
 * @returns 数据库工作区内容
 */
const AppDevDatabaseWorkspace: React.FC<AppDevDatabaseWorkspaceProps> = ({
  appId,
  activeTab,
  env,
  devContainerStatus,
  prodContainerStatus,
  onRetryContainer,
  iframeKey = 0,
}) => {
  return (
    <div className={cx(styles.workspace)}>
      <div
        className={cx(styles.pane, {
          [styles.hidden]:
            activeTab !== 'database' || env !== UserAppDbEnvEnum.Dev,
        })}
      >
        <AppDevDatabasePanel
          appId={appId}
          env={UserAppDbEnvEnum.Dev}
          containerStatus={devContainerStatus}
          iframeKey={iframeKey}
          onRetryContainer={
            env === UserAppDbEnvEnum.Dev ? onRetryContainer : undefined
          }
        />
      </div>
      <div
        className={cx(styles.pane, {
          [styles.hidden]:
            activeTab !== 'database' || env !== UserAppDbEnvEnum.Prod,
        })}
      >
        <AppDevDatabasePanel
          appId={appId}
          env={UserAppDbEnvEnum.Prod}
          containerStatus={prodContainerStatus}
          iframeKey={iframeKey}
          onRetryContainer={
            env === UserAppDbEnvEnum.Prod ? onRetryContainer : undefined
          }
        />
      </div>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: activeTab !== 'database-config',
        })}
      >
        {activeTab === 'database-config' ? (
          <AppDevDatabaseConfigPanel key={env} appId={appId} env={env} active />
        ) : null}
      </div>
    </div>
  );
};

export default AppDevDatabaseWorkspace;
