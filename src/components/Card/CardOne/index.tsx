import type { CardProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片一
 */
const CardOne: React.FC<CardProps> = ({
  className,
  title,
  desc,
  img,
  onClick,
}) => {
  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'hover-box',
        'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <img className={'radius-6'} src={img} alt="" />
      <div className={cx(styles.box, 'flex-1')}>
        <h3>{title}</h3>
        <p className={'text-ellipsis-2'}>{desc}</p>
      </div>
    </div>
  );
};

export default CardOne;
