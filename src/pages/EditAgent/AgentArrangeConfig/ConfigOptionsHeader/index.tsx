import type { ConfigOptionsHeaderProps } from '@/types/interfaces/space';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

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
      )}
    >
      <p className={cx(styles['title'])}>{title}</p>
      {children}
    </div>
  );
};

export default ConfigOptionsHeader;
