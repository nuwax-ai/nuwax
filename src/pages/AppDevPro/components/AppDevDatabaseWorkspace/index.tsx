import classNames from 'classnames';
import React from 'react';
import { UserAppDbEnvEnum } from '../../services/appDb';
import AppDevDatabaseConfigPanel from '../AppDevDatabaseConfigPanel';
import AppDevDatabasePanel from '../AppDevDatabasePanel';
import styles from './index.less';

const cx = classNames.bind(styles);

export type AppDevDatabaseWorkspaceTab = 'database' | 'database-config';

export interface AppDevDatabaseWorkspaceProps {
  /** 应用 ID */
  appId: number;
  /** 当前环境，由 Header 中间切换控制 */
  env: UserAppDbEnvEnum;
  /** 当前 Tab：数据库页面 / 数据库配置 */
  activeTab: AppDevDatabaseWorkspaceTab;
}

/**
 * 数据库工作区内容：嵌入的数据库页面与原数据库配置组件。
 * Tab 头由外层 PreviewTabBar 承载，此处只渲染对应面板，切换时不卸载 iframe。
 *
 * @param props.appId 应用 ID
 * @param props.env 当前环境（开发 / 线上）
 * @param props.activeTab 当前激活的数据库 Tab
 * @returns 数据库工作区内容
 */
const AppDevDatabaseWorkspace: React.FC<AppDevDatabaseWorkspaceProps> = ({
  appId,
  env,
  activeTab,
}) => {
  return (
    <div className={cx(styles.workspace)}>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: activeTab !== 'database',
        })}
      >
        <AppDevDatabasePanel appId={appId} env={env} />
      </div>
      <div
        className={cx(styles.pane, {
          [styles.hidden]: activeTab !== 'database-config',
        })}
      >
        <AppDevDatabaseConfigPanel appId={appId} env={env} />
      </div>
    </div>
  );
};

export default AppDevDatabaseWorkspace;
