import { CardChildProps } from '@/types/interfaces/cardInfo';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片三
 */
const CardThree: React.FC<CardChildProps> = ({
  className,
  title,
  content,
  onClick,
}) => {
  return (
    <div
      className={cx(styles.container, 'cursor-pointer', className)}
      onClick={onClick}
    >
      <h3 className={'text-ellipsis-2'}>{title}</h3>
      <p className={'text-ellipsis-2'}>{content}</p>
    </div>
  );
};

export default CardThree;
