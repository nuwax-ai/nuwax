import { CardProps } from '@/types/interfaces/cardInfo';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片四
 */
const CardFour: React.FC<CardProps> = ({
  className,
  title,
  content,
  onClick,
}) => {
  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'flex-col',
        'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <h3>{title}</h3>
      <p className={'text-ellipsis-2'}>{content}</p>
    </div>
  );
};

export default CardFour;
