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
  /** 当前环境容器状态，进入数据库管理页前须先就绪 */
  containerStatus?: UserAppEnvPodStatus;
  /** 重试启动当前环境容器 */
  onRetryContainer?: () => void;
}

/**
 * 数据库工作区：数据库与数据库设置各保留一个入口，内容跟随 Header 环境。
 * Tab 头由外层 PreviewTabBar 承载，配置面板仅在进入时挂载。
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
  containerStatus,
  onRetryContainer,
}) => {
  return (
    <div className={cx(styles.workspace)}>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: activeTab !== 'database',
        })}
      >
        <AppDevDatabasePanel
          key={env}
          appId={appId}
          env={env}
          containerStatus={containerStatus}
          onRetryContainer={onRetryContainer}
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
