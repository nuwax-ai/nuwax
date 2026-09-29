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
  /** 开发环境容器重启成功后重挂该环境 iframe */
  devIframeKey?: number;
  /** 线上环境容器重启成功后重挂该环境 iframe */
  prodIframeKey?: number;
  /** 数据库工作区是否正在展示（不在应用预览等其它页时为 false） */
  visible?: boolean;
}

/**
 * 数据库工作区：开发 / 线上各保留一套面板。
 * 某个环境第一次可见时才加载；之后切走仍保留该环境 iframe，互不影响。
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
  devIframeKey = 0,
  prodIframeKey = 0,
  visible = true,
}) => {
  const showDevDatabase =
    visible && activeTab === 'database' && env === UserAppDbEnvEnum.Dev;
  const showProdDatabase =
    visible && activeTab === 'database' && env === UserAppDbEnvEnum.Prod;

  return (
    <div className={cx(styles.workspace)}>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: !showDevDatabase,
        })}
      >
        <AppDevDatabasePanel
          appId={appId}
          env={UserAppDbEnvEnum.Dev}
          containerStatus={devContainerStatus}
          iframeKey={devIframeKey}
          active={showDevDatabase}
          onRetryContainer={
            env === UserAppDbEnvEnum.Dev ? onRetryContainer : undefined
          }
        />
      </div>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: !showProdDatabase,
        })}
      >
        <AppDevDatabasePanel
          appId={appId}
          env={UserAppDbEnvEnum.Prod}
          containerStatus={prodContainerStatus}
          iframeKey={prodIframeKey}
          active={showProdDatabase}
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
