import { dict } from '@/services/i18nRuntime';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

interface AppDevProcessGroupProps {
  children: React.ReactNode;
  count: number;
}

/**
 * AppDev 过程组件分组容器
 * 用于折叠展示多个连续的工具调用或任务
 */
const AppDevProcessGroup: React.FC<AppDevProcessGroupProps> = ({
  children,
  count,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles['process-group']}>
      <div
        className={styles['group-header']}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles['header-left']}>
          <span className={styles['group-title']}>
            {dict('PC.Components.MarkdownRenderer.executedProcesses')} {count}{' '}
            {dict('PC.Components.MarkdownRenderer.items')}
          </span>
        </div>
        <DownOutlined
          className={classNames(styles['expand-icon'], {
            [styles['expanded']]: isExpanded,
          })}
        />
      </div>
      {isExpanded && <div className={styles['group-body']}>{children}</div>}
    </div>
  );
};

export default AppDevProcessGroup;
