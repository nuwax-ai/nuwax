import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SystemVersionPanelProps {
  /** 租户配置中的系统版本号 */
  version?: string;
}

/**
 * 系统版本展示面板
 */
const SystemVersionPanel: React.FC<SystemVersionPanelProps> = ({ version }) => {
  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.title)}>
        {dict('PC.Constants.Menus.systemVersion')}
      </div>
      <div className={cx(styles.content, 'scroll-container')}>
        <div className={cx(styles.configItem)}>
          <div className={cx(styles.label)}>
            {dict('PC.Pages.Setting.currentSystemVersion')}
          </div>
          <div className={cx(styles.value)}>{version || '--'}</div>
        </div>
      </div>
    </div>
  );
};

export default SystemVersionPanel;
