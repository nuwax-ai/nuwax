import type { LabelStarProps } from '@/types/interfaces/library';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const LabelStar: React.FC<LabelStarProps> = ({ label }) => {
  return (
    <span className={cx(styles.container, 'flex')}>
      <span>{label}</span>
      <span className={cx(styles.star)}>*</span>
    </span>
  );
};

export default LabelStar;
