import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { getUserAppVncProxyUrl } from '../../services/appDevPro';
import styles from '../AppDevDatabasePanel/index.less';

const cx = classNames.bind(styles);

export interface AppDevRemoteDesktopPanelProps {
  /** 应用 ID，用于拼远程桌面代理地址 */
  appId?: number;
}

/**
 * AppDevPro 远程桌面：嵌入开发环境 VNC 代理页。
 *
 * @param props.appId 应用 ID
 * @returns 远程桌面面板
 */
const AppDevRemoteDesktopPanel: React.FC<AppDevRemoteDesktopPanelProps> = ({
  appId,
}) => {
  const iframeSrc = useMemo(() => {
    if (!appId) {
      return '';
    }
    return getUserAppVncProxyUrl(appId);
  }, [appId]);

  if (!iframeSrc) {
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.empty)}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppDevPro.remoteDesktopEmpty')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.container)}>
      <iframe
        key={iframeSrc}
        className={cx(styles.iframe)}
        src={iframeSrc}
        title={dict('PC.Pages.AppDevPro.remoteDesktop')}
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
};

export default AppDevRemoteDesktopPanel;
