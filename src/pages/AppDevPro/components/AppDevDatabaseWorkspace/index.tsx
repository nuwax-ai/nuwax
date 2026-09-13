import classNames from 'classnames';
import React from 'react';
import type { UserAppEnvPodStatus } from '../../hooks/useUserAppEnvPod';
import { UserAppDbEnvEnum } from '../../services/appDb';
import AppDevDatabaseConfigPanel from '../AppDevDatabaseConfigPanel';
import AppDevDatabasePanel from '../AppDevDatabasePanel';
import styles from './index.less';

const cx = classNames.bind(styles);

export type AppDevDatabaseWorkspaceTab =
  | 'database'
  | 'database-config'
  | 'database-prod'
  | 'database-config-prod';

export interface AppDevDatabaseWorkspaceProps {
  /** 应用 ID */
  appId: number;
  /** 当前 Tab */
  activeTab: AppDevDatabaseWorkspaceTab;
  /** 线上环境容器状态，进入线上数据库管理页前须先就绪 */
  prodContainerStatus?: UserAppEnvPodStatus;
  /** 重试启动线上环境容器 */
  onRetryProdContainer?: () => void;
}

/**
 * 数据库工作区：开发 / 线上各一套管理页与配置。
 * Tab 头由外层 PreviewTabBar 承载；两个 iframe 切换时不卸载，配置面板仅在进入时挂载。
 *
 * @param props.appId 应用 ID
 * @param props.activeTab 当前激活的数据库 Tab
 * @returns 数据库工作区内容
 */
const AppDevDatabaseWorkspace: React.FC<AppDevDatabaseWorkspaceProps> = ({
  appId,
  activeTab,
  prodContainerStatus,
  onRetryProdContainer,
}) => {
  return (
    <div className={cx(styles.workspace)}>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: activeTab !== 'database',
        })}
      >
        <AppDevDatabasePanel appId={appId} env={UserAppDbEnvEnum.Dev} />
      </div>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: activeTab !== 'database-prod',
        })}
      >
        <AppDevDatabasePanel
          appId={appId}
          env={UserAppDbEnvEnum.Prod}
          containerStatus={prodContainerStatus}
          onRetryContainer={onRetryProdContainer}
        />
      </div>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: activeTab !== 'database-config',
        })}
      >
        {activeTab === 'database-config' ? (
          <AppDevDatabaseConfigPanel
            appId={appId}
            env={UserAppDbEnvEnum.Dev}
            active
          />
        ) : null}
      </div>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: activeTab !== 'database-config-prod',
        })}
      >
        {activeTab === 'database-config-prod' ? (
          <AppDevDatabaseConfigPanel
            appId={appId}
            env={UserAppDbEnvEnum.Prod}
            active
          />
        ) : null}
      </div>
    </div>
  );
};

export default AppDevDatabaseWorkspace;
