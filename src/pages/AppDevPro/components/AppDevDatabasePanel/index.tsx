import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { getUserAppDbProxyUrl, UserAppDbEnvEnum } from '../../services/appDb';
import AppDevProIframe from '../AppDevProIframe';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevDatabasePanelProps {
  /** 应用 ID，用于拼数据库代理地址 */
  appId?: number;
  /** 当前环境，由 Header 中间切换控制 */
  env: UserAppDbEnvEnum;
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
}) => {
  const iframeSrc = useMemo(() => {
    if (!appId) {
      return '';
    }
    return getUserAppDbProxyUrl(appId, env);
  }, [appId, env]);

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
