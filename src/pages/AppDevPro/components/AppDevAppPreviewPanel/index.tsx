import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from '../AppDevDatabasePanel/index.less';

const cx = classNames.bind(styles);

export interface AppDevAppPreviewPanelProps {
  /** 当前环境对应的应用预览地址 */
  previewUrl?: string;
  /** 刷新计数，变化时强制重新加载 iframe */
  refreshKey?: number;
}

/**
 * AppDevPro 应用预览页签：嵌入当前环境的应用访问地址。
 *
 * @param props.previewUrl 预览 URL
 * @param props.refreshKey 刷新标记
 * @returns 应用预览面板
 */
const AppDevAppPreviewPanel: React.FC<AppDevAppPreviewPanelProps> = ({
  previewUrl,
  refreshKey = 0,
}) => {
  if (!previewUrl) {
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.empty)}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppDevPro.appPreviewEmpty')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.container)}>
      <iframe
        key={`${previewUrl}-${refreshKey}`}
        className={cx(styles.iframe)}
        src={previewUrl}
        title={dict('PC.Pages.AppDevPro.appPreview')}
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
};

export default AppDevAppPreviewPanel;
