import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConfigOptionsHeaderProps {
  title: string;
}

/**
 * 智能体配置项header
 */
const ConfigOptionsHeader: React.FC<
  PropsWithChildren<ConfigOptionsHeaderProps>
> = ({ children, title }) => {
  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'content-between',
        'items-center',
        'px-6',
      )}
    >
      <span>{title}</span>
      {children}
    </div>
  );
};

export default ConfigOptionsHeader;
