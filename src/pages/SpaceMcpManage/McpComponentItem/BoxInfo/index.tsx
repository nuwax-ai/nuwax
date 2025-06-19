import type { BoxInfoProps } from '@/types/interfaces/library';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const BoxInfo: React.FC<BoxInfoProps> = ({ icon, text }) => {
  if (!text) {
    return null;
  }
  return (
    <span
      className={cx(
        styles.box,
        'flex',
        'items-center',
        'content-center',
        'px-6',
      )}
    >
      {icon}
      <span>{text}</span>
    </span>
  );
};

export default BoxInfo;
