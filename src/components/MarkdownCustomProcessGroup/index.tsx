import { dict } from '@/services/i18nRuntime';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { memo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MarkdownCustomProcessGroupProps {
  children: React.ReactNode;
}

const MarkdownCustomProcessGroup: React.FC<MarkdownCustomProcessGroupProps> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 计算子元素数量（过滤掉可能的空白节点）
  const processCount = React.Children.toArray(children).filter((child) =>
    React.isValidElement(child),
  ).length;

  if (processCount === 0) return null;

  return (
    <div className={cx(styles['markdown-custom-process-group'])}>
      <div
        className={cx(styles['group-header'])}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cx(styles['header-left'])}>
          <span className={cx(styles['group-title'])}>
            {dict('PC.Components.MarkdownRenderer.executedProcesses')}
          </span>
        </div>
        <div className={cx(styles['header-right'])}>
          <span className={cx(styles['process-count'])}>
            {processCount} {dict('PC.Components.MarkdownRenderer.items')}
          </span>
          <DownOutlined
            className={cx(styles['expand-icon'], {
              [styles['is-expanded']]: isExpanded,
            })}
          />
        </div>
      </div>
      {isExpanded && (
        <div className={cx(styles['group-content'])}>{children}</div>
      )}
    </div>
  );
};

export default memo(MarkdownCustomProcessGroup);
