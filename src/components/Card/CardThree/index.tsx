import type { CardProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片三
 */
const CardThree: React.FC<CardProps> = ({
  className,
  title,
  desc,
  img,
  onClick,
}) => {
  return (
    <div
      className={cx(styles.container, 'hover-box', 'cursor-pointer', className)}
      onClick={onClick}
    >
      <h3>{title}</h3>
      <img className={'radius-6'} src={img} alt="" />
      <p className={'text-ellipsis-2'}>{desc}</p>
    </div>
  );
};

export default CardThree;
