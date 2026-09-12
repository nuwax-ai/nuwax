import classNames from 'classnames';
import React from 'react';
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
}

/**
 * 数据库工作区：开发 / 在线各一套管理页与配置。
 * Tab 头由外层 PreviewTabBar 承载；两个 iframe 切换时不卸载，配置面板仅在进入时挂载。
 *
 * @param props.appId 应用 ID
 * @param props.activeTab 当前激活的数据库 Tab
 * @returns 数据库工作区内容
 */
const AppDevDatabaseWorkspace: React.FC<AppDevDatabaseWorkspaceProps> = ({
  appId,
  activeTab,
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
        <AppDevDatabasePanel appId={appId} env={UserAppDbEnvEnum.Prod} />
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
