import type { CardProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片二
 */
const CardTwo: React.FC<CardProps> = ({
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
        'flex-col',
        'hover-box',
        'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <h3>{title}</h3>
      <div className={'flex'}>
        <p className={'flex-1 text-ellipsis-2'}>{desc}</p>
        <img className={'radius-6'} src={img} alt="" />
      </div>
    </div>
  );
};

export default CardTwo;
